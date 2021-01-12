<template>
  <div id="q-app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { mapGetters, mapMutations } from 'vuex'
import { LocalStorage, openURL } from 'quasar'
import { defineComponent } from '@vue/composition-api'
import { Manga } from './classes/manga'
import { NotifyOptions } from './classes/notifyOptions'
import { UrlNavigation } from './classes/urlNavigation'
import { tryMigrateMangaList, tryMigrateSettings } from './services/migrationService'
import { checkUpdates, getChangelog, GithubRelease, getApkAsset, getElectronAsset } from './services/updateService'
import ConfirmationDialog from 'src/components/ConfirmationDialog.vue'
import { version } from '../package.json'
import { checkSites } from './services/siteService'
import { Settings } from './classes/settings'
import { createList, getAuthUrl, getNotifyOptions, setAccessToken, setShareId, updateList } from './services/gitlabService'
import qs from 'qs'
import { InitializeComponents } from './classes/initializeComponents'

export default defineComponent({
  name: 'App',

  computed: {
    ...mapGetters('reader', {
      notification: 'notification',
      urlNavigation: 'urlNavigation',
      settings: 'settings',
      mangaList: 'mangaList',
      initialized: 'initialized'
    })
  },

  data () {
    return {
      windowSize: [] as Array<number>,
      shareSyncInterval: undefined as NodeJS.Timeout | undefined
    }
  },

  watch: {
    notification (notifyOptions: NotifyOptions | undefined) {
      if (!(notifyOptions instanceof NotifyOptions)) return

      if (notifyOptions.message instanceof Error) {
        console.error(notifyOptions.message)
      }

      return this.$q.notify(notifyOptions.getOptions())
    },

    urlNavigation (urlNavigation: UrlNavigation | undefined) {
      if (!(urlNavigation instanceof UrlNavigation)) return
      const openInBrowser = (this.settings as Settings).openInBrowser

      if (urlNavigation.openInApp || !openInBrowser) {
        this.openInApp(urlNavigation.url, urlNavigation.openInApp)
      } else if (this.$q.platform.is.mobile) {
        window.location.href = urlNavigation.url
      } else {
        openURL(urlNavigation.url)
      }
    },

    windowSize (value: Array<number>) {
      this.updateMobileView(value[0] <= 850)
    },

    settings (newSettings: Settings, settings: Settings) {
      newSettings = Settings.clone(newSettings)

      if (newSettings.equals(settings)) return

      if (newSettings.darkMode !== settings.darkMode) {
        this.$q.dark.set(newSettings.darkMode)
      }

      if (newSettings.sortedBy !== settings.sortedBy || newSettings.filters !== settings.filters) {
        this.sortMangaList()
      }

      LocalStorage.set(this.$constants.SETTINGS, newSettings)
    },

    initialized (initialized: InitializeComponents) {
      if (!initialized.main) {
        void this.onInitialize()

        initialized.main = true
        this.updateInitialized(initialized)
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

    tryMigrateSettings()
    tryMigrateMangaList()

    this.loadSettings()
    this.initMangaList()

    this.updateInitialized(new InitializeComponents())
  },

  methods: {
    ...mapMutations('reader', {
      updateMangaList: 'updateMangaList',
      updateMobileView: 'updateMobileView',
      updateSettings: 'updateSettings',
      sortMangaList: 'sortMangaList',
      pushNotification: 'pushNotification',
      pushUrlNavigation: 'pushUrlNavigation',
      updateInitialized: 'updateInitialized'
    }),

    async onInitialize () {
      this.doUpdateCheck()

      const changelog = await getChangelog()
      if (changelog) {
        this.$q.dialog({
          component: ConfirmationDialog,
          title: 'Changelog',
          content: changelog,
          hideCancel: true
        }).onDismiss(() => {
          LocalStorage.set(this.$constants.MIGRATION_VERSION, version)
        })
      }

      this.startShareSyncInterval()
    },

    loadSettings () {
      const settings: Settings = LocalStorage.getItem(this.$constants.SETTINGS) || new Settings()
      this.updateSettings(settings)
    },

    openInApp (url: string, forced: boolean) {
      if (this.$q.platform.is.mobile) {
        const browser = this.$q.cordova.InAppBrowser.open(url)
        if (!forced) return

        browser.addEventListener('exit', () => {
          checkSites()
        })
        browser.addEventListener('loadstart', (event) => {
          if (event.url.startsWith('http://localhost/redirect_gitlab')) {
            browser.close()

            const notifyOptions = new NotifyOptions('Logged in successfully!')
            notifyOptions.type = 'positive'
            this.pushNotification(notifyOptions)

            const queryString = qs.parse(event.url.replace('http://localhost/redirect_gitlab#', ''))
            setAccessToken(queryString.access_token as string)

            this.$q.loading.show({
              delay: 100
            })
            createList(JSON.stringify(this.mangaList)).catch(error => {
              this.pushNotification(getNotifyOptions(error))
            }).finally(() => {
              this.$q.loading.hide()
            })
          }
        })
      } else {
        window.location.href = url
      }
    },

    initMangaList () {
      const mangaList: Manga[] = LocalStorage.getItem(this.$constants.MANGA_LIST_KEY) || []
      this.updateMangaList(mangaList)
    },

    startShareSyncInterval () {
      if (this.shareSyncInterval) {
        clearInterval(this.shareSyncInterval)
        this.shareSyncInterval = undefined
      }

      this.updateShareList()
      this.shareSyncInterval = setInterval(() => {
        this.updateShareList()
      }, 5 * 60 * 1000)
    },

    doUpdateCheck () {
      checkUpdates().then(result => {
        if (result) {
          this.showUpdateAvailable(result)
        }
      }).catch(error => this.pushNotification(new NotifyOptions(error, 'Failed to check for updates')))
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
            this.pushUrlNavigation(new UrlNavigation(electronAsset.browser_download_url, false))
          }
        },
        color: 'white'
      }]

      this.pushNotification(notifyOptions)
    },

    updateShareList () {
      updateList(JSON.stringify(this.mangaList))
        .catch(error => {
          const notifyOptions = getNotifyOptions(error)

          if (notifyOptions.caption?.includes('404') || notifyOptions.caption?.includes('id is invalid')) {
            setShareId('')
            return
          } else if (notifyOptions.caption?.includes('spam')) {
            return
          }

          const actions = []
          actions.push(
            {
              label: 'Visit',
              handler: () => {
                this.pushUrlNavigation(new UrlNavigation('https://gitlab.com/dashboard', false))
              },
              color: 'white'
            }
          )
          if (notifyOptions.caption?.includes('401 Unauthorized') || notifyOptions.caption?.includes('Not logged in')) {
            actions.push(
              {
                label: 'Relog',
                handler: () => {
                  this.pushUrlNavigation(new UrlNavigation(getAuthUrl(), true))
                },
                color: 'white'
              }
            )
          }
          notifyOptions.actions = actions

          this.pushNotification(notifyOptions)
          console.error(error)
        })
    }
  }
})
</script>
