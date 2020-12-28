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
import { tryMigrateMangaList } from './services/migrationService'
import { getChangelog } from './services/updateService'
import ConfirmationDialog from 'src/components/ConfirmationDialog.vue'
import { version } from '../package.json'
import { RefreshOptions } from './classes/refreshOptions'
import { checkSites } from './services/siteService'

function mangaSort (a: Manga, b: Manga): number {
  if ((b.chapter !== b.read && a.chapter !== a.read) || (b.chapter === b.read && a.chapter === a.read)) {
    return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1
  } else {
    return b.chapter !== b.read ? 1 : -1
  }
}

export default defineComponent({
  name: 'App',

  computed: {
    ...mapGetters('reader', {
      notification: 'notification',
      urlNavigation: 'urlNavigation',
      openInBrowser: 'openInBrowser'
    })
  },

  data () {
    return {
      windowSize: [] as Array<number>
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
      const openInBrowser = this.openInBrowser as boolean

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
    }
  },

  async mounted () {
    this.windowSize = [window.innerWidth, window.innerHeight]

    this.$nextTick(() => {
      window.addEventListener('resize', () => {
        this.windowSize = [window.innerWidth, window.innerHeight]
      })
    })

    this.loadSettings()

    tryMigrateMangaList()
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
  },

  methods: {
    ...mapMutations('reader', {
      updateMangaList: 'updateMangaList',
      updateOpenInBrowser: 'updateOpenInBrowser',
      updateDarkMode: 'updateDarkMode',
      updateMobileView: 'updateMobileView',
      updateRefreshOptions: 'updateRefreshOptions'
    }),

    loadSettings () {
      const openInBrowser: boolean = LocalStorage.getItem(this.$constants.OPEN_BROWSER_KEY) || false
      this.updateOpenInBrowser(openInBrowser)

      const darkMode: boolean = LocalStorage.getItem(this.$constants.DARK_MODE_KEY) || false
      this.$q.dark.set(darkMode)
      this.updateDarkMode(darkMode)

      const refreshOptions: RefreshOptions = LocalStorage.getItem(this.$constants.REFRESH_OPTIONS) || new RefreshOptions()
      this.updateRefreshOptions(refreshOptions)
    },

    openInApp (url: string, forced: boolean) {
      if (this.$q.platform.is.mobile) {
        const browser = this.$q.cordova.InAppBrowser.open(url)
        if (!forced) return

        browser.addEventListener('exit', () => {
          checkSites()
        })
      } else {
        window.location.href = url
      }
    },

    initMangaList () {
      const mangaList: Manga[] = LocalStorage.getItem(this.$constants.MANGA_LIST_KEY) || []
      mangaList.sort(mangaSort)
      this.updateMangaList(mangaList)
    }
  }
})
</script>
