<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>{{ title }}</q-toolbar-title>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-toolbar>

      <q-card-section>
        <div class="text-body2 content">{{ content }}</div>

        <q-input v-model="search" :placeholder="searchPlaceholder" @keydown.enter="onSearch(siteType)">
          <template v-if="search" v-slot:append>
            <q-icon name="cancel" @click.stop="search = ''; updateSearchResults([])" class="cursor-pointer"></q-icon>
          </template>

          <template v-slot:after>
            <q-btn round dense flat icon="send" @click="onSearch(siteType)"></q-btn>
          </template>
        </q-input>

        <q-btn no-caps class="q-mt-lg full-width manga-dropdown" v-if="searchResults.length > 0" :label="mangaTitle || 'Selected manga'">
          <q-menu auto-close :max-width="$q.platform.is.mobile ? '60%' : '40%'" max-height="40%" v-model="searchDropdownShown">
            <q-list separator>
            <q-item v-for="manga in searchResults" :key="manga.url" clickable @click="url = manga.url; mangaTitle = manga.title">
              <q-item-section avatar>
                <q-img contain class="manga-image-search" :src="manga.image"></q-img>
              </q-item-section>

              <q-item-section>
                <div class="text-subtitle2">{{ manga.title }}</div>
                <div class="text-body2">{{ manga.chapter }}</div>
                <div>{{ siteNames[manga.site] }}</div>
              </q-item-section>
            </q-item>
            </q-list>
          </q-menu>
        </q-btn>

        <q-input v-if="searchResults.length === 0" v-model="url" :placeholder="manualPlaceholder"></q-input>
      </q-card-section>

      <q-card-actions>
        <q-space />

        <q-btn color="secondary" :label="confirmButton" @click="onOKClick"></q-btn>
        <q-btn label="Cancel" v-close-popup></q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import Vue, { VueConstructor } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { QDialog } from 'quasar'
import relevancy from 'relevancy'
import { SiteName, SiteType } from 'src/enums/siteEnum'
import { searchManga } from 'src/services/siteService'
import { Manga } from 'src/classes/manga'
import { NotifyOptions } from 'src/classes/notifyOptions'

const mangaSearchSorter = new relevancy.Sorter({
  comparator: (a: Manga, b: Manga) => {
    return mangaSort(a, b)
  }
})

function mangaSort (a: Manga, b: Manga): number {
  if ((b.chapter !== b.read && a.chapter !== a.read) || (b.chapter === b.read && a.chapter === a.read)) {
    return a.title > b.title ? 1 : -1
  } else {
    return b.chapter !== b.read ? 1 : -1
  }
}

export default (Vue as VueConstructor<Vue &
  { $refs:
    { dialog: QDialog },
  }
>).extend({
  props: {
    title: String,
    content: String,
    initialSearch: String,
    searchPlaceholder: String,
    manualPlaceholder: String,
    siteType: String,
    confirmButton: String
  },

  data () {
    return {
      search: '',
      url: '',
      mangaTitle: '',
      searchDropdownShown: true,
      siteNames: SiteName
    }
  },

  computed: {
    ...mapGetters('reader', {
      mangaList: 'mangaList',
      searchResults: 'searchResults'
    })
  },

  mounted () {
    this.search = this.initialSearch
    this.updateSearchResults([])
  },

  methods: {
    ...mapMutations('reader', {
      pushNotification: 'pushNotification',
      updateSearchResults: 'updateSearchResults'
    }),

    show () {
      this.$refs.dialog.show()
    },

    hide () {
      this.updateSearchResults([])
      this.$refs.dialog.hide()
    },

    onSearch (siteTypeName: string | undefined = undefined) {
      if (!this.search) return
      this.$q.loading.show({
        delay: 100
      })

      const siteType = Object.values(SiteType).find(siteType => siteTypeName === siteType)
      searchManga(this.search, siteType)
        .then(result => {
          this.searchDropdownShown = true

          // Some websites return results from other websites...
          const processedResults: string[] = []

          const searchResults = result.filter(resultManga => {
            const alreadyAdded = !(this.mangaList as Manga[]).find(manga => resultManga.url === manga.url) && !processedResults.includes(resultManga.url)
            processedResults.push(resultManga.url)

            return alreadyAdded
          })

          this.updateSearchResults(mangaSearchSorter.sort(searchResults, this.search, (obj, calc) => {
            return calc(obj.title)
          }))
        })
        .catch(error => this.pushNotification(new NotifyOptions(error)))
        .finally(() => {
          this.$q.loading.hide()
        })
    },

    onDialogHide () {
      this.$emit('hide')
    },

    onOKClick () {
      this.$emit('ok', { url: this.url })
      this.hide()
    },

    onCancelClick () {
      this.hide()
    }
  }
})
</script>

<style lang="scss">

.manga-image-search {
  min-width: 48px;
  width: 48px;
}

.manga-dropdown a {
  color: black;
  pointer-events: none;
}

.content {
  white-space: pre-wrap;
}

</style>
