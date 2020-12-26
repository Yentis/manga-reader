<template>
  <q-card-section>
    <q-input v-model="search" :placeholder="searchPlaceholder" @keydown.enter="onSearch(siteType)">
      <template v-if="search" v-slot:append>
        <q-icon name="cancel" @click.stop="search = ''; updateSearchResults([])" class="cursor-pointer"></q-icon>
      </template>

      <template v-slot:after>
        <q-btn round dense flat icon="send" @click="onSearch(siteType)"></q-btn>
      </template>
    </q-input>

    <q-btn no-caps class="q-mt-lg full-width manga-dropdown" v-if="searchResults.length > 0" :label="mangaTitle || 'Selected manga'">
      <q-menu auto-close :max-width="mobileView ? '60%' : '40%'" max-height="40%" v-model="searchDropdownShown">
        <q-list separator>
        <q-item v-for="manga in searchResults" :key="manga.url" clickable @click="$emit('change', manga.url); mangaTitle = manga.title">
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

    <q-input v-if="searchResults.length === 0" v-bind:value="url" v-on:change="$emit('change', $event.target.value)" :placeholder="manualPlaceholder"></q-input>
  </q-card-section>
</template>

<script lang="ts">
import relevancy from 'relevancy'
import { mapGetters, mapMutations } from 'vuex'
import { defineComponent } from '@vue/composition-api'
import { SiteName, SiteType } from 'src/enums/siteEnum'
import { getSite, searchManga } from 'src/services/siteService'
import { Manga } from 'src/classes/manga'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'

const mangaSearchSorter = new relevancy.Sorter({
  comparator: (a: Manga, b: Manga) => {
    return mangaSort(a, b)
  }
})

function mangaSort (a: Manga, b: Manga): number {
  if ((b.chapter !== b.read && a.chapter !== a.read) || (b.chapter === b.read && a.chapter === a.read)) {
    return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1
  } else {
    return b.chapter !== b.read ? 1 : -1
  }
}

export default defineComponent({
  name: 'manga-search',

  model: {
    prop: 'url',
    event: 'change'
  },

  props: {
    url: String,
    searchPlaceholder: String,
    manualPlaceholder: String,
    initialSearch: String,
    siteType: String
  },

  data () {
    return {
      search: '',
      mangaTitle: '',
      siteNames: SiteName,
      searchDropdownShown: true
    }
  },

  mounted () {
    this.search = this.initialSearch || ''
  },

  computed: {
    ...mapGetters('reader', {
      mangaList: 'mangaList',
      searchResults: 'searchResults',
      mobileView: 'mobileView'
    })
  },

  methods: {
    ...mapMutations('reader', {
      pushNotification: 'pushNotification',
      updateSearchResults: 'updateSearchResults'
    }),

    onSearch (siteTypeName: string | undefined = undefined) {
      const siteType = Object.values(SiteType).find(siteType => siteTypeName === siteType) ||
                       Object.values(LinkingSiteType).find(siteType => siteTypeName === siteType)

      if (siteTypeName !== undefined) {
        if (siteType === undefined) return
        const loggedIn = this.handleSingleSite(siteType)
        if (!loggedIn) return
      }

      if (!this.search) return

      this.$q.loading.show({
        delay: 100
      })

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

          if (searchResults.length === 0) {
            this.pushNotification(new NotifyOptions('No results found'))
          }

          this.updateSearchResults(mangaSearchSorter.sort(searchResults, this.search, (obj, calc) => {
            return calc(obj.title)
          }))
        })
        .catch(error => this.pushNotification(new NotifyOptions(error)))
        .finally(() => {
          this.$q.loading.hide()
        })
    },

    handleSingleSite (siteType: SiteType | LinkingSiteType): boolean {
      const site = getSite(siteType)
      if (!site) return false

      if (!site.loggedIn) {
        site.openLogin(this).then((loggedIn) => {
          if (loggedIn === true) {
            const notifyOptions = new NotifyOptions('Logged in successfully!')
            notifyOptions.type = 'positive'
            this.pushNotification(notifyOptions)
            this.onSearch(siteType)
          } else if (loggedIn instanceof Error) {
            this.pushNotification(new NotifyOptions(loggedIn))
          }
        }).catch((error) => {
          this.pushNotification(new NotifyOptions(error))
        })

        return false
      }

      return true
    }
  }
})
</script>

<style lang="scss" scoped>

.manga-image-search {
  min-width: 48px;
  width: 48px;
}

.manga-dropdown a {
  color: black;
  pointer-events: none;
}

</style>
