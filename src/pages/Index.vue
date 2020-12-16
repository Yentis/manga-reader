<template>
  <q-page class="q-ma-sm">
    <manga-header />

    <div class="header">
      <div :class="{ 'flex-column-between': $q.platform.is.mobile, 'q-gutter-sm': $q.platform.is.mobile }">
        <q-btn v-if="$q.platform.is.mobile" color="secondary" label="Refresh" @click="onRefreshAllManga" />
        <q-btn v-else color="secondary" label="Refresh Manga" @click="onRefreshAllManga" />
      </div>
      <div :class="{ 'flex-column-between': $q.platform.is.mobile, 'q-gutter-sm': $q.platform.is.mobile }">
        <q-btn v-if="$q.platform.is.mobile" color="info" icon="backup" :loading="exporting" :disable="importing" @click="exportList" />
        <q-btn v-else class="q-mr-sm" color="info" label="Export to Dropbox" :loading="exporting" :disable="importing" @click="exportList" />
        <q-btn v-if="$q.platform.is.mobile" color="accent" icon="cloud_download" :loading="importing" :disable="exporting" @click="importList" />
        <q-btn v-else color="accent" label="Import from Dropbox" :loading="importing" :disable="exporting" @click="importList" />
      </div>
      <div class="flex-column-between">
        <q-checkbox v-model="openBrowser" label="Open in browser" @input="saveOpenBrowser" />
        <q-checkbox v-model="darkMode" label="Dark mode" @input="saveDarkMode" />
      </div>
    </div>

    <q-linear-progress
      v-if="refreshing"
      :indeterminate="refreshProgress === 0"
      :value="refreshProgress"
      instant-feedback
      size="xl"
      class="q-mt-sm"
    ></q-linear-progress>

    <div class="manga-container q-mt-sm full-width">
      <q-intersection once class="q-mb-sm full-width" v-for="(manga, index) in sortedMangaList" :key="manga.url">
        <q-card :class="{ 'card-container': manga.chapter !== manga.read }">
          <q-card-section horizontal>
            <q-img contain class="manga-image q-ma-sm" :src="manga.image">
              <template v-slot:error>
                <div class="error-image bg-negative">
                  <q-icon class="full-width full-height" size="xl" name="image_not_supported"></q-icon>
                </div>
              </template>
            </q-img>

            <q-card-section class="q-pb-none flex-column-between">
              <div class="q-mb-sm">
                <div class="text-h6">
                  <a :href="manga.url" @click.prevent="onLinkClick(manga.url)">{{ manga.title }}</a>
                </div>
                <div class="text-body2">
                  Read:&nbsp;&nbsp;&nbsp;&nbsp; <a v-if="manga.readUrl" :href="manga.readUrl" @click.prevent="onLinkClick(manga.readUrl || '#')">{{ manga.read }}</a>
                  <span v-else>{{ manga.read }}</span>
                </div>
                <div class="text-body2">
                  Current: <a v-if="manga.chapterUrl" :href="manga.chapterUrl" @click.prevent="onLinkClick(manga.chapterUrl)">{{ manga.chapter }}</a>
                  <span v-else>{{ manga.chapter }}</span>
                </div>
                <div class="text-body2" v-if="manga.chapterDate">
                  {{ manga.chapterDate }}
                </div>
              </div>
              <div class="text-subtitle1">
                {{ siteNames[manga.site] }}
              </div>
            </q-card-section>

            <q-space />

            <q-card-actions vertical>
              <q-space />

              <q-btn v-if="$q.platform.is.mobile && !manga.mangaDexId" color="info" icon="link" @click="onLinkClicked(index)" />
              <q-btn v-else-if="!manga.mangaDexId" color="info" label="Link with MangaDex" @click="onLinkClicked(index)" />
            </q-card-actions>

            <q-card-actions vertical>
              <q-btn
                flat
                icon="close"
                @click="onDeleteClick(index)" />

              <q-space />

              <q-btn
                v-if="manga.chapter !== manga.read"
                color="secondary"
                icon="done"
                @click="onReadClick(index)" />
            </q-card-actions>
          </q-card-section>
        </q-card>
      </q-intersection>
    </div>

    <q-dialog v-model="mangaDexModalShown">
      <q-card>
        <q-toolbar class="bg-primary text-white">
          <q-toolbar-title>Select manga</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-toolbar>

        <q-card-section>
          <q-input v-model="search" placeholder="Search for the manga" @keydown.enter="searchManga(siteTypes.MangaDex)">
            <template v-if="search" v-slot:append>
              <q-icon name="cancel" @click.stop="search = ''; searchResults = []" class="cursor-pointer"></q-icon>
            </template>

            <template v-slot:after>
              <q-btn round dense flat icon="send" @click="searchManga(siteTypes.MangaDex)"></q-btn>
            </template>
          </q-input>

          <q-btn no-caps class="q-mt-lg full-width manga-dropdown" v-if="searchResults.length > 0" :label="title || 'Selected manga'">
            <q-menu auto-close :max-width="$q.platform.is.mobile ? '60%' : '40%'" max-height="40%" v-model="searchDropdownShown">
              <q-list separator>
                <q-item v-for="manga in searchResults" :key="manga.url" clickable @click="url = manga.url; title = manga.title">
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

          <q-input v-if="searchResults.length === 0" v-model="url" placeholder="Or enter the url manually"></q-input>
        </q-card-section>

        <q-card-actions>
          <q-btn color="secondary" label="Select" @click="linkMangaDex"></q-btn>
          <q-btn label="Cancel" v-close-popup></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { mapGetters, mapMutations } from 'vuex'
import { defineComponent } from '@vue/composition-api'
import { LocalStorage, openURL } from 'quasar'
import relevancy from 'relevancy'
import moment from 'moment'
import pEachSeries from 'p-each-series'
import { Manga } from 'src/classes/manga'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { UpdateManga } from 'src/classes/updateManga'
import { SiteType, SiteName } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga, checkLogins, syncReadChapter } from 'src/services/siteService'
import { checkUpdates, GithubRelease, getElectronAsset, getApkAsset } from 'src/services/updateService'
import { saveList, readList, getAuthUrl, setAccessToken, getAccessToken, cordovaLogin } from 'src/services/dropboxService'
import MangaHeader from 'src/components/Header.vue'
import CustomDialog from 'src/components/CustomDialog.vue'

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

export default defineComponent({
  data () {
    return {
      mangaDexModalShown: false,
      notificationShown: true,
      searchDropdownShown: true,
      importing: false,
      exporting: false,
      url: '',
      title: '',
      search: '',
      searchResults: [] as Manga[],
      notificationText: '',
      openBrowser: false,
      darkMode: false,
      siteNames: SiteName,
      siteTypes: SiteType,
      pendingMangaDexIndex: -1,
      refreshProgress: 0
    }
  },

  components: {
    MangaHeader
  },

  computed: {
    ...mapGetters('reader', {
      mangaList: 'mangaList',
      refreshing: 'refreshing'
    }),
    sortedMangaList: function (): Manga[] {
      return (this.mangaList as Manga[]).sort(mangaSort)
    }
  },

  methods: {
    ...mapMutations('reader', {
      updateRefreshing: 'updateRefreshing',
      pushNotification: 'pushNotification',
      updateMangaList: 'updateMangaList',
      removeManga: 'removeManga',
      updateManga: 'updateManga'
    }),

    resetState () {
      this.updateRefreshing(false)
      this.importing = false
      this.exporting = false
      this.$q.loading.hide()
    },
    searchManga (siteType: SiteType | undefined = undefined) {
      if (!this.search) return
      this.$q.loading.show({
        delay: 100
      })

      searchManga(this.search, siteType).then(result => {
        this.searchDropdownShown = true

        // Some websites return results from other websites...
        const processedResults: string[] = []

        const searchResults = result.filter(resultManga => {
          const alreadyAdded = !(this.mangaList as Manga[]).find(manga => resultManga.url === manga.url) && !processedResults.includes(resultManga.url)
          processedResults.push(resultManga.url)

          return alreadyAdded
        })

        this.searchResults = mangaSearchSorter.sort(searchResults, this.search, (obj, calc) => {
          return calc(obj.title)
        })
        this.$q.loading.hide()
      }).catch(error => this.showNotification(new NotifyOptions(error)))
    },
    showUpdateAvailable (githubRelease: GithubRelease) {
      const notifyOptions = new NotifyOptions(`Update available: ${githubRelease.tag_name}`)
      notifyOptions.type = 'positive'
      notifyOptions.position = 'bottom'
      notifyOptions.actions = [{
        label: 'Download',
        handler: () => {
          if (this.$q.platform.is.mobile) {
            const apkAsset = getApkAsset(githubRelease)
            if (!apkAsset) return
            window.location.href = apkAsset.browser_download_url
          } else {
            const electronAsset = getElectronAsset(githubRelease)
            if (!electronAsset) return
            this.onLinkClick(electronAsset.browser_download_url)
          }
        },
        color: 'white'
      }]

      this.showNotification(notifyOptions)
    },
    saveOpenBrowser () {
      LocalStorage.set(this.$constants.OPEN_BROWSER_KEY, this.openBrowser)
    },
    saveDarkMode () {
      this.$q.dark.set(this.darkMode)
      LocalStorage.set(this.$constants.DARK_MODE_KEY, this.darkMode)
    },
    showNotification (notifyOptions: NotifyOptions) {
      this.resetState()
      this.pushNotification(notifyOptions)
    },
    onLinkClick (url: string) {
      // Mobile will open the InAppBrowser when openURL is called
      const openBrowser = this.$q.platform.is.mobile ? !this.openBrowser : this.openBrowser
      if (openBrowser) {
        openURL(url)
      } else {
        window.location.href = url
      }
    },
    onReadClick (index: number) {
      const manga = (this.mangaList as Manga[])[index]
      manga.read = manga.chapter
      manga.readUrl = manga.chapterUrl

      if (manga.mangaDexId) {
        syncReadChapter(manga.mangaDexId, manga.chapterNum).then(() => {
          const notifyOptions = new NotifyOptions('Synced with MangaDex')
          notifyOptions.type = 'positive'
          this.showNotification(notifyOptions)
        }).catch(error => {
          console.error(error)
          this.showNotification(new NotifyOptions(Error('Failed to sync with MangaDex')))
        })
      }

      this.updateManga(new UpdateManga(manga, index))
      LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
    },

    onDeleteClick (index: number) {
      const manga = (this.mangaList as Manga[])[index]

      this.$q.dialog({
        component: CustomDialog,
        title: 'Delete manga',
        content: `Are you sure you want to delete ${manga.title}?`,
        imageUrl: manga.image
      }).onOk(() => {
        this.removeManga(index)
        LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
      })
    },

    onRefreshAllManga () {
      if (this.refreshing) return
      this.refreshProgress = 0.01
      this.updateRefreshing(true)

      const promises = (this.mangaList as Manga[]).map(manga => getMangaInfo(manga.url, manga.site))
      const step = promises.length > 0 ? (1 / promises.length) : 0
      pEachSeries(promises, (result, index) => {
        const manga = (this.mangaList as Manga[])[index]

        if (result instanceof Error) {
          const notifyOptions = new NotifyOptions(`Failed to refresh ${manga.title}`)
          notifyOptions.caption = result.message
          notifyOptions.actions = [{
            label: 'Visit',
            handler: () => {
              this.onLinkClick(manga.url)
            },
            color: 'white'
          }]

          this.showNotification(notifyOptions)
        } else {
          const read = manga.read
          const readUrl = manga.readUrl
          const mangaDexId = manga.mangaDexId

          result.read = read
          result.readUrl = readUrl
          result.mangaDexId = mangaDexId

          this.updateManga(new UpdateManga(result, index))
        }

        this.refreshProgress += step
      }).catch((error: Error) => {
        this.showNotification(new NotifyOptions(error))
      }).finally(() => {
        LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
        this.updateRefreshing(false)
        this.refreshProgress = 0
      })
    },
    openInApp (url: string) {
      if (this.$q.platform.is.mobile) {
        const browser = this.$q.cordova.InAppBrowser.open(url)

        browser.addEventListener('exit', () => {
          checkLogins()
        })
      } else {
        window.location.href = url
      }
    },
    exportList () {
      this.exporting = true

      if (!getAccessToken()) {
        this.dropboxLogin()
      } else {
        saveList(this.mangaList).then(() => {
          const notifyOptions = new NotifyOptions('Exported!')
          notifyOptions.type = 'positive'
          this.showNotification(notifyOptions)
        }).catch((error: Error) => {
          if (error.message === 'Unauthorized') {
            this.dropboxLogin()
          } else {
            this.showNotification(new NotifyOptions(error))
          }
        })
      }
    },
    importList () {
      this.importing = true

      if (!getAccessToken()) {
        this.dropboxLogin()
      } else {
        readList().then(mangaList => {
          const notifyOptions = new NotifyOptions('Imported!')
          notifyOptions.type = 'positive'
          this.showNotification(notifyOptions)
          this.updateMangaList(mangaList)
          LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
        }).catch((error: Error) => {
          if (error.message === 'Unauthorized') {
            this.dropboxLogin()
          } else {
            this.showNotification(new NotifyOptions(error))
          }
        })
      }
    },
    dropboxLogin () {
      if (this.$q.platform.is.mobile) {
        cordovaLogin().then(token => {
          const notifyOptions = new NotifyOptions('Logged in successfully!')
          notifyOptions.type = 'positive'
          this.showNotification(notifyOptions)
          setAccessToken(token)
        }).catch(error => this.showNotification(new NotifyOptions(error)))
      } else {
        this.openInApp(getAuthUrl())
      }
    },
    onLinkClicked (index: number) {
      this.pendingMangaDexIndex = index

      const manga = (this.mangaList as Manga[])[index]
      this.search = manga.title

      if (manga.site === SiteType.MangaDex) {
        this.url = manga.url
        this.linkMangaDex()
        return
      }

      this.mangaDexModalShown = true
    },
    linkMangaDex () {
      if (this.pendingMangaDexIndex === -1) return
      if (this.url === '') return

      const manga = (this.mangaList as Manga[])[this.pendingMangaDexIndex]
      const matches = /\/title\/(\d*)\//gm.exec(this.url) || []
      let mangaId = -1

      for (const match of matches) {
        const parsedMatch = parseInt(match)
        if (!isNaN(parsedMatch)) mangaId = parsedMatch
      }

      if (mangaId !== -1) {
        manga.mangaDexId = mangaId

        this.updateManga(new UpdateManga(manga, this.pendingMangaDexIndex))
        LocalStorage.set(this.$constants.MANGA_LIST_KEY, this.mangaList)
      }

      this.pendingMangaDexIndex = -1
      this.url = ''
      this.mangaDexModalShown = false
      this.search = ''
    }
  },
  mounted () {
    const openBrowser: boolean = LocalStorage.getItem(this.$constants.OPEN_BROWSER_KEY) || false
    this.openBrowser = openBrowser

    const darkMode: boolean = LocalStorage.getItem(this.$constants.DARK_MODE_KEY) || false
    this.$q.dark.set(darkMode)
    this.darkMode = darkMode

    if (this.$q.platform.is.mobile) {
      window.cookieMaster.setCookieValue(`.${SiteType.Webtoons}`, 'ageGatePass', 'true', () => undefined, (error) => console.error(error))
      window.cookieMaster.setCookieValue(`.${SiteType.Webtoons}`, 'timezoneOffset', (moment().utcOffset() / 60).toString(), () => undefined, (error) => console.error(error))
    }

    if (this.$q.platform.is.electron) {
      this.$q.electron.ipcRenderer.on('dropbox-token', (event, token) => {
        const notifyOptions = new NotifyOptions('Logged in successfully!')
        notifyOptions.type = 'positive'
        this.showNotification(notifyOptions)
        setAccessToken(token)
      })
    }

    checkUpdates().then(result => {
      if (result) {
        this.showUpdateAvailable(result)
      }
    }).catch(error => this.showNotification(new NotifyOptions(error)))
  }
})
</script>

<style lang="scss">

.body--light {
  .card-container {
    background-color: $grey-4;
  }
}

.body--dark {
  .card-container {
    background-color: $grey-9;
  }
}

.flex-column-between {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.flex-column-between button {
  width: 100%;
}

a {
  text-decoration: none;
  color: $primary;
}

.header {
  display: flex;
  justify-content: space-between;
}

.manga-container {
  display: inline-block;
}

.card-container a {
  color: $secondary;
}

.manga-image {
  min-width: 96px;
  width: 96px;
}

.error-image {
  min-width: 96px;
  min-height: 96px;
  width: 96px;
  height: 96px;
}

.manga-image-search {
  min-width: 48px;
  width: 48px;
}

.manga-dropdown a {
  color: black;
  pointer-events: none;
}

</style>
