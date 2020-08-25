<template>
  <q-page class="q-ma-sm">
    <div class="header">
      <div :class="{ 'flex-column-between': $q.platform.is.mobile, 'q-gutter-sm': $q.platform.is.mobile }">
        <q-btn color="primary q-mr-sm" label="Add manga" @click="onAddManga()" />
        <q-btn color="secondary q-mr-sm" label="Refresh manga" @click="onRefreshAllManga" />
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

    <q-linear-progress v-if="loading" indeterminate size="xl" class="q-mt-sm"></q-linear-progress>

    <div class="manga-container q-mt-sm full-width">
      <q-intersection once class="q-mb-sm full-width" v-for="(manga, index) in mangaList" :key="manga.url">
        <q-card :class="{ 'card-container': manga.chapter !== manga.read }">
          <q-card-section horizontal>
            <q-img contain class="manga-image q-ma-sm" :src="manga.image" @error="showLoadImageFailed">
              <template v-slot:error>
                <div class="error-image bg-negative">
                  <q-icon class="full-width full-height" size="xl" name="image_not_supported"></q-icon>
                </div>
              </template>
            </q-img>

            <q-card-section class="q-pb-none flex-column-between">
              <div>
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
              </div>
              <div class="text-subtitle1">
                {{ siteNames[manga.site] }}
              </div>
            </q-card-section>

            <q-space />

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

    <q-dialog v-model="addModalShown">
      <q-card>
        <q-toolbar class="bg-primary text-white">
          <q-toolbar-title>Add manga</q-toolbar-title>
          <q-btn icon="close" flat round dense v-close-popup />
        </q-toolbar>

        <q-card-section>
          <q-input v-model="search" placeholder="Search for a manga" @keydown.enter="searchManga">
            <template v-if="search" v-slot:append>
              <q-icon name="cancel" @click.stop="search = ''; searchResults = []" class="cursor-pointer"></q-icon>
            </template>

            <template v-slot:after>
              <q-btn round dense flat icon="send" @click="searchManga"></q-btn>
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

          <q-input v-if="searchResults.length === 0" v-model="url" placeholder="Or enter a manga url manually"></q-input>
        </q-card-section>

        <q-card-actions>
          <q-btn color="secondary" label="Add" @click="addManga"></q-btn>
          <q-btn label="Cancel" v-close-popup></q-btn>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog
      no-focus
      no-refocus
      seamless
      :value="addModalShown && siteModalShown && (!$q.platform.is.mobile || searchResults.length === 0)"
      :position="$q.platform.is.mobile ? 'bottom' : 'right'">
      <q-card :class="{ 'mobile-site-dialog': $q.platform.is.mobile }">
        <q-toolbar class="bg-primary text-white text-center">
          <q-toolbar-title>Supported sites</q-toolbar-title>
        </q-toolbar>
        <q-card-section class="q-pa-none">
          <q-list separator :class="{ 'text-center': $q.platform.is.mobile }">
            <q-item
              clickable
              v-for="site in siteMap"
              :key="site.siteType"
              :class="{ 'bg-warning': !site.canSearch(), 'text-black': !site.canSearch() && $q.dark.isActive }"
              @click="site.loggedIn ? onLinkClick(site.getUrl()) : openLogin(site.getLoginUrl())">
              <q-item-section>
                <q-item-label :class="{ 'full-width': $q.platform.is.mobile }">{{ siteNames[site.siteType] }}</q-item-label>
                <q-item-label v-if="!site.canSearch()" :class="{ 'text-grey-8': $q.dark.isActive }" caption>Search disabled{{ !site.loggedIn ? ' | Click to login' : '' }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'
import { LocalStorage, openURL } from 'quasar'
import { Manga } from 'src/classes/manga'
import { SiteType, SiteName } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga, getSiteMap, checkLogins } from 'src/services/siteService'
import { checkUpdates, GithubRelease, getElectronAsset, getApkAsset } from 'src/services/updateService'
import relevancy from 'relevancy'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { BaseSite } from 'src/classes/sites/baseSite'
import { saveList, readList, getAuthUrl, setAccessToken, getAccessToken, cordovaLogin } from 'src/services/dropboxService'

const MANGA_LIST_KEY = 'manga'
const OPEN_BROWSER_KEY = 'open_browser'
const DARK_MODE_KEY = 'dark_mode'
// eslint-disable-next-line @typescript-eslint/ban-types
let hidePersistentError: Function | undefined

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

function siteSort (a: BaseSite, b: BaseSite): number {
  if (!a.canSearch() && b.canSearch()) {
    return -1
  } else if (!b.loggedIn && a.loggedIn) {
    return 1
  } else {
    return SiteName[a.siteType] > SiteName[b.siteType] ? 1 : -1
  }
}

export default defineComponent({
  data () {
    return {
      addModalShown: false,
      notificationShown: true,
      windowSize: [] as Array<number>,
      siteModalShown: true,
      searchDropdownShown: true,
      loading: false,
      importing: false,
      exporting: false,
      url: '',
      title: '',
      search: '',
      searchResults: [] as Manga[],
      notificationText: '',
      mangaList: [] as Manga[],
      openBrowser: false,
      darkMode: false,
      siteMap: [] as BaseSite[],
      siteNames: SiteName
    }
  },
  watch: {
    windowSize (value: Array<number>) {
      if (value[0] <= 700 && !this.$q.platform.is.mobile) this.siteModalShown = false
      else if (value[1] <= 500 && this.$q.platform.is.mobile) this.siteModalShown = false
      else this.siteModalShown = true
    }
  },
  methods: {
    resetState () {
      this.loading = false
      this.importing = false
      this.exporting = false
      this.$q.loading.hide()
    },
    resetInput () {
      this.url = ''
      this.title = ''
      this.search = ''
      this.searchResults = []
      this.searchDropdownShown = true
    },
    searchManga () {
      if (!this.search) return
      this.$q.loading.show({
        delay: 100
      })

      searchManga(this.search).then(result => {
        // Some websites return results from other websites...
        const processedResults: string[] = []

        const searchResults = result.filter(resultManga => {
          const alreadyAdded = !this.mangaList.find(manga => resultManga.url === manga.url) && !processedResults.includes(resultManga.url)
          processedResults.push(resultManga.url)

          return alreadyAdded
        })

        this.searchResults = mangaSearchSorter.sort(searchResults, this.search, (obj, calc) => {
          return calc(obj.title)
        })
        this.$q.loading.hide()
      }).catch(error => this.showNotification(new NotifyOptions(error)))
    },
    addManga () {
      this.loading = true
      this.addModalShown = false

      for (const site of Object.values(SiteType)) {
        if (this.url.includes(site)) {
          getMangaInfo(this.url, site).then(manga => {
            manga.read = manga.chapter
            manga.readUrl = manga.chapterUrl
            this.saveManga(manga)
          }).catch(error => this.showNotification(new NotifyOptions(error)))

          this.resetInput()
          return
        }
      }

      this.showNotification(new NotifyOptions(Error('Valid site not found')))
    },
    saveManga (manga: Manga) {
      for (const entry of this.mangaList) {
        if (entry.url === manga.url) {
          this.showNotification(new NotifyOptions(Error('Manga already exists')))
          return
        }
      }

      this.mangaList.unshift(manga)
      LocalStorage.set(MANGA_LIST_KEY, this.mangaList)
      this.loading = false
    },
    showLoadImageFailed () {
      if (hidePersistentError) hidePersistentError()

      const notifyOptions = new NotifyOptions('One or more images could not be loaded')
      notifyOptions.timeout = 0
      notifyOptions.position = 'top'
      notifyOptions.actions = [{
        label: 'Refresh manga',
        handler: () => {
          this.onRefreshAllManga()
        },
        color: 'white'
      }, {
        label: 'Dismiss',
        color: 'white'
      }]

      hidePersistentError = this.showNotification(notifyOptions)
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

      hidePersistentError = this.showNotification(notifyOptions)
    },
    saveOpenBrowser () {
      LocalStorage.set(OPEN_BROWSER_KEY, this.openBrowser)
    },
    saveDarkMode () {
      this.$q.dark.set(this.darkMode)
      LocalStorage.set(DARK_MODE_KEY, this.darkMode)
    },
    showNotification (notifyOptions: NotifyOptions) {
      if (notifyOptions.message instanceof Error) {
        console.error(notifyOptions.message)
      }

      this.resetState()

      return this.$q.notify(notifyOptions.getOptions())
    },
    onAddManga () {
      this.addModalShown = true
      this.siteMap = Array.from(getSiteMap().values()).sort(siteSort)
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
      const manga = this.mangaList[index]
      manga.read = manga.chapter
      manga.readUrl = manga.chapterUrl

      this.$set(this.mangaList, index, manga)
      LocalStorage.set(MANGA_LIST_KEY, this.mangaList)
    },
    onDeleteClick (index: number) {
      this.mangaList.splice(index, 1)
      LocalStorage.set(MANGA_LIST_KEY, this.mangaList)
    },
    onRefreshAllManga () {
      if (this.loading) return

      this.loading = true
      const promises: Promise<Manga>[] = []

      for (let i = 0; i < this.mangaList.length; i++) {
        const manga = this.mangaList[i]
        promises.push(getMangaInfo(manga.url, manga.site))
      }

      Promise.all(promises).then(results => {
        for (let i = 0; i < results.length; i++) {
          const result = results[i]
          const read = this.mangaList[i].read
          const readUrl = this.mangaList[i].readUrl

          this.mangaList[i] = result
          this.mangaList[i].read = read
          this.mangaList[i].readUrl = readUrl
        }

        this.mangaList.sort(mangaSort)
        LocalStorage.set(MANGA_LIST_KEY, this.mangaList)
        this.loading = false
      }).catch(error => this.showNotification(new NotifyOptions(error)))
    },
    openLogin (url: string) {
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
          this.mangaList = mangaList
          LocalStorage.set(MANGA_LIST_KEY, this.mangaList)
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
        this.openLogin(getAuthUrl())
      }
    }
  },
  mounted () {
    this.windowSize = [window.innerWidth, window.innerHeight]

    this.$nextTick(() => {
      window.addEventListener('resize', () => {
        this.windowSize = [window.innerWidth, window.innerHeight]
      })
    })

    const mangaList: Manga[] = LocalStorage.getItem(MANGA_LIST_KEY) || []
    mangaList.sort(mangaSort)
    this.mangaList = mangaList

    const openBrowser: boolean = LocalStorage.getItem(OPEN_BROWSER_KEY) || false
    this.openBrowser = openBrowser

    const darkMode: boolean = LocalStorage.getItem(DARK_MODE_KEY) || false
    this.$q.dark.set(darkMode)
    this.darkMode = darkMode

    if (this.$q.platform.is.mobile) {
      window.cookieMaster.setCookieValue(`.${SiteType.Webtoons}`, 'ageGatePass', 'true', () => undefined, (error) => console.error(error))
    }

    if (this.$q.platform.is.electron) {
      this.$q.electron.ipcRenderer.on('dropbox-token', (event, token) => {
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

.mobile-site-dialog {
  height: 25vh;
  min-height: 25vh;
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
