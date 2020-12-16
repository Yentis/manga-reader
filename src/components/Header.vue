<template>
    <div class="header">
      <div :class="{ 'flex-column-between': $q.platform.is.mobile, 'q-gutter-sm': $q.platform.is.mobile }">
        <q-btn v-if="$q.platform.is.mobile" color="primary" label="Add" @click="onAddManga" />
        <q-btn v-else class="q-mr-sm" color="primary" label="Add Manga" @click="onAddManga" />
        <!--<q-btn v-if="$q.platform.is.mobile" color="secondary" label="Refresh" @click="onRefreshAllManga" />
        <q-btn v-else color="secondary" label="Refresh Manga" @click="onRefreshAllManga" />!-->
      </div>
      <!--<div :class="{ 'flex-column-between': $q.platform.is.mobile, 'q-gutter-sm': $q.platform.is.mobile }">
        <q-btn v-if="$q.platform.is.mobile" color="info" icon="backup" :loading="exporting" :disable="importing" @click="exportList" />
        <q-btn v-else class="q-mr-sm" color="info" label="Export to Dropbox" :loading="exporting" :disable="importing" @click="exportList" />
        <q-btn v-if="$q.platform.is.mobile" color="accent" icon="cloud_download" :loading="importing" :disable="exporting" @click="importList" />
        <q-btn v-else color="accent" label="Import from Dropbox" :loading="importing" :disable="exporting" @click="importList" />
      </div>
      <div class="flex-column-between">
        <q-checkbox v-model="openBrowser" label="Open in browser" @input="saveOpenBrowser" />
        <q-checkbox v-model="darkMode" label="Dark mode" @input="saveDarkMode" />
      </div>!-->
    </div>
</template>

<script lang="ts">
import { LocalStorage } from 'quasar'
import { mapGetters, mapMutations } from 'vuex'
import { defineComponent } from '@vue/composition-api'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo } from 'src/services/siteService'
import SearchDialog from './SearchDialog.vue'
import SiteDialog from './SiteDialog.vue'

export default defineComponent({
  name: 'manga-header',

  computed: {
    ...mapGetters('reader', {
      mangaList: 'mangaList'
    })
  },

  methods: {
    ...mapMutations('reader', {
      updateRefreshing: 'updateRefreshing',
      pushNotification: 'pushNotification',
      addManga: 'addManga'
    }),

    onAddManga () {
      this.$q.dialog({
        component: SearchDialog,
        parent: this,
        title: 'Add manga'
      }).onOk((data: { url: string }) => {
        this.onMangaSelected(data.url)
      }).onDismiss(() => {
        if (siteDialog) {
          siteDialog.hide()
        }
      })

      const siteDialog = this.$q.dialog({
        component: SiteDialog,
        parent: this
      })
    },

    onMangaSelected (url: string) {
      const site = Object.values(SiteType).find(site => url.includes(site))
      if (site === undefined) {
        this.pushNotification(new NotifyOptions(Error('Valid site not found')))
        return
      }

      this.updateRefreshing(true)
      getMangaInfo(url, site)
        .then(manga => {
          if (manga instanceof Error) {
            this.pushNotification(new NotifyOptions(manga))
          } else {
            manga.read = manga.chapter
            manga.readUrl = manga.chapterUrl
            this.onMangaRetrieved(manga)
          }
        })
        .catch(error => this.pushNotification(new NotifyOptions(error)))
        .finally(() => this.updateRefreshing(false))
    },

    onMangaRetrieved (manga: Manga) {
      for (const entry of this.mangaList as Manga[]) {
        if (entry.url === manga.url) {
          this.pushNotification(new NotifyOptions(Error('Manga already exists')))
          return
        }
      }

      this.addManga(manga)
      LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
      this.updateRefreshing(false)
    }
  }
})
</script>

<style lang="scss">

.header {
  display: flex;
  justify-content: space-between;
}

</style>
