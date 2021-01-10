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
import { getChangelog } from './services/updateService'
import ConfirmationDialog from 'src/components/ConfirmationDialog.vue'
import { version } from '../package.json'
import { checkSites } from './services/siteService'
import { Settings } from './classes/settings'
import { getAuthUrl, setAccessToken, setShareId, updateList } from './services/gitlabService'
import qs from 'qs'

export default defineComponent({
  name: 'App',

  computed: {
    ...mapGetters('reader', {
      notification: 'notification',
      urlNavigation: 'urlNavigation',
      settings: 'settings',
      mangaList: 'mangaList'
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
    }
  },

  async mounted () {
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

  methods: {
    ...mapMutations('reader', {
      updateMangaList: 'updateMangaList',
      updateMobileView: 'updateMobileView',
      updateSettings: 'updateSettings',
      sortMangaList: 'sortMangaList',
      pushNotification: 'pushNotification',
      pushUrlNavigation: 'pushUrlNavigation'
    }),

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

            const queryString = qs.parse(event.url.replace('http://localhost/redirect_gitlab#', ''))
            setAccessToken(queryString.access_token as string)

            const notifyOptions = new NotifyOptions('Logged in successfully!')
            notifyOptions.type = 'positive'
            this.pushNotification(notifyOptions)
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

      this.onUpdateList()
      this.shareSyncInterval = setInterval(() => {
        this.onUpdateList()
      }, 5 * 60 * 1000)
    },

    onUpdateList () {
      updateList(JSON.stringify(this.mangaList))
        .catch(error => {
          if (error instanceof Error) {
            if (error.message.includes('404')) {
              setShareId('')
              return
            } else if (error.message.includes('400')) {
              // Spam, ignore
              return
            }
          }

          const notifyOptions = new NotifyOptions(error, 'Failed to update share URL')
          notifyOptions.actions = [{
            label: 'Relog',
            handler: () => {
              this.pushUrlNavigation(new UrlNavigation(getAuthUrl(), true))
            },
            color: 'white'
          }]
          this.pushNotification(notifyOptions)
          console.error(error)
        })
    }
  }
})
</script>
