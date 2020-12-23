<template>
    <div class="header">
      <div :class="{ 'flex-column-between': $q.platform.is.mobile, 'q-gutter-sm': $q.platform.is.mobile }">
        <q-btn v-if="$q.platform.is.mobile" color="primary" label="Add" @click="onAddManga" />
        <q-btn v-else class="q-mr-sm" color="primary" label="Add Manga" @click="onAddManga" />
        <q-btn v-if="$q.platform.is.mobile" color="secondary" label="Refresh" @click="onRefreshAllManga" />
        <q-btn v-else color="secondary" label="Refresh Manga" @click="onRefreshAllManga" />
      </div>
      <div :class="{ 'flex-column-between': $q.platform.is.mobile, 'q-gutter-sm': $q.platform.is.mobile }">
        <q-btn v-if="$q.platform.is.mobile" color="info" icon="backup" :loading="exporting" :disable="importing" @click="onExportList" />
        <q-btn v-else class="q-mr-sm" color="info" label="Export to Dropbox" :loading="exporting" :disable="importing" @click="onExportList" />
        <q-btn v-if="$q.platform.is.mobile" color="accent" icon="cloud_download" :loading="importing" :disable="exporting" @click="onImportList" />
        <q-btn v-else color="accent" label="Import from Dropbox" :loading="importing" :disable="exporting" @click="onImportList" />
      </div>
      <div class="flex-column-between">
        <q-checkbox :value="openInBrowser" label="Open in browser" @input="saveOpenInBrowser" />
        <q-checkbox :value="darkMode" label="Dark mode" @input="saveDarkMode" />
      </div>
    </div>
</template>

<script lang="ts">
import { LocalStorage } from 'quasar'
import { mapGetters, mapMutations } from 'vuex'
import { defineComponent } from '@vue/composition-api'
import pEachSeries from 'p-each-series'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo } from 'src/services/siteService'
import { saveList, readList, getAuthUrl, setAccessToken, getAccessToken, cordovaLogin } from 'src/services/dropboxService'
import SearchDialog from './SearchDialog.vue'
import SiteDialog from './SiteDialog.vue'
import { UrlNavigation } from 'src/classes/urlNavigation'

export default defineComponent({
  name: 'manga-header',

  data () {
    return {
      exporting: false,
      importing: false
    }
  },

  computed: {
    ...mapGetters('reader', {
      mangaList: 'mangaList',
      refreshing: 'refreshing',
      refreshProgress: 'refreshProgress',
      openInBrowser: 'openInBrowser',
      darkMode: 'darkMode'
    })
  },

  methods: {
    ...mapMutations('reader', {
      updateRefreshing: 'updateRefreshing',
      updateRefreshProgress: 'updateRefreshProgress',
      incrementRefreshProgress: 'incrementRefreshProgress',
      pushNotification: 'pushNotification',
      updateMangaList: 'updateMangaList',
      addManga: 'addManga',
      updateManga: 'updateManga',
      pushUrlNavigation: 'pushUrlNavigation',
      updateOpenInBrowser: 'updateOpenInBrowser',
      updateDarkMode: 'updateDarkMode'
    }),

    onAddManga () {
      this.$q.dialog({
        component: SearchDialog,
        parent: this,
        title: 'Add manga',
        searchPlaceholder: 'Search for a manga',
        manualPlaceholder: 'Or enter a manga url manually',
        confirmButton: 'Add'
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
            manga.readNum = manga.chapterNum
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
    },

    onRefreshAllManga () {
      if (this.refreshing) return
      this.updateRefreshProgress(0.01)
      this.updateRefreshing(true)

      const filteredMangaList = (this.mangaList as Manga[]).filter(manga => !manga.completed)
      const promises = filteredMangaList.map(manga => getMangaInfo(manga.url, manga.site))
      const step = promises.length > 0 ? (1 / promises.length) : 0
      pEachSeries(promises, (result, index) => {
        const manga = filteredMangaList[index]

        if (result instanceof Error) {
          const notifyOptions = new NotifyOptions(`Failed to refresh ${manga.title}`)
          notifyOptions.caption = result.message
          notifyOptions.actions = [{
            label: 'Visit',
            handler: () => {
              this.pushUrlNavigation(new UrlNavigation(manga.url, true))
            },
            color: 'white'
          }]

          this.pushNotification(notifyOptions)
        } else {
          manga.title = result.title
          manga.chapter = result.chapter
          manga.chapterUrl = result.chapterUrl
          manga.chapterNum = result.chapterNum
          manga.chapterDate = result.chapterDate
          manga.image = result.image

          this.updateManga(manga)
        }

        this.incrementRefreshProgress(step)
      }).catch((error: Error) => {
        this.pushNotification(new NotifyOptions(error))
      }).finally(() => {
        LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
        this.updateRefreshing(false)
        this.updateRefreshProgress(0)
      })
    },

    onImportList () {
      if (!getAccessToken()) {
        this.startDropboxLogin()
      } else {
        this.importing = true

        readList().then(mangaList => {
          const notifyOptions = new NotifyOptions('Imported!')
          notifyOptions.type = 'positive'
          this.pushNotification(notifyOptions)
          this.updateMangaList(mangaList)
          LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
        }).catch((error: Error) => {
          if (error.message === 'Unauthorized') {
            this.startDropboxLogin()
          } else {
            this.pushNotification(new NotifyOptions(error))
          }
        }).finally(() => {
          this.importing = false
        })
      }
    },

    onExportList () {
      if (!getAccessToken()) {
        this.startDropboxLogin()
      } else {
        this.exporting = true

        saveList(this.mangaList).then(() => {
          const notifyOptions = new NotifyOptions('Exported!')
          notifyOptions.type = 'positive'
          this.pushNotification(notifyOptions)
        }).catch((error: Error) => {
          if (error.message === 'Unauthorized') {
            this.startDropboxLogin()
          } else {
            this.pushNotification(new NotifyOptions(error))
          }
        }).finally(() => {
          this.exporting = false
        })
      }
    },

    startDropboxLogin () {
      if (this.$q.platform.is.mobile) {
        cordovaLogin()
          .then(token => {
            const notifyOptions = new NotifyOptions('Logged in successfully! Please import / export again')
            notifyOptions.type = 'positive'
            this.pushNotification(notifyOptions)
            setAccessToken(token)
          })
          .catch(error => this.pushNotification(new NotifyOptions(error)))
      } else {
        this.pushUrlNavigation(new UrlNavigation(getAuthUrl(), true))
      }
    },

    saveOpenInBrowser (checked: boolean) {
      this.updateOpenInBrowser(checked)
      LocalStorage.set(this.$constants.OPEN_BROWSER_KEY, checked)
    },

    saveDarkMode (checked: boolean) {
      this.$q.dark.set(checked)
      this.updateDarkMode(checked)
      LocalStorage.set(this.$constants.DARK_MODE_KEY, checked)
    }
  }
})
</script>

<style lang="scss" scoped>

.header {
  display: flex;
  justify-content: space-between;
}

.flex-column-between button {
  width: 100%;
}

</style>
