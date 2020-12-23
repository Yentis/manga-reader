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
import { checkLogins } from './services/siteService'
import { tryMigrateMangaList } from './services/migrationService'

function mangaSort (a: Manga, b: Manga): number {
  if ((b.chapter !== b.read && a.chapter !== a.read) || (b.chapter === b.read && a.chapter === a.read)) {
    return a.title > b.title ? 1 : -1
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
      if (urlNavigation.openInApp) {
        this.openInApp(urlNavigation.url)
        return
      }

      // Mobile will open the InAppBrowser when openURL is called
      const openInBrowserValue = this.openInBrowser as boolean
      const openInBrowser = this.$q.platform.is.mobile ? !openInBrowserValue : openInBrowserValue
      if (openInBrowser) {
        openURL(urlNavigation.url)
      } else {
        window.location.href = urlNavigation.url
      }
    }
  },

  methods: {
    ...mapMutations('reader', {
      updateMangaList: 'updateMangaList',
      updateOpenInBrowser: 'updateOpenInBrowser',
      updateDarkMode: 'updateDarkMode'
    }),

    openInApp (url: string) {
      if (this.$q.platform.is.mobile) {
        const browser = this.$q.cordova.InAppBrowser.open(url)

        browser.addEventListener('exit', () => {
          checkLogins()
        })
      } else {
        window.location.href = url
      }
    }
  },

  mounted () {
    const openInBrowser: boolean = LocalStorage.getItem(this.$constants.OPEN_BROWSER_KEY) || false
    this.updateOpenInBrowser(openInBrowser)

    const darkMode: boolean = LocalStorage.getItem(this.$constants.DARK_MODE_KEY) || false
    this.$q.dark.set(darkMode)
    this.updateDarkMode(darkMode)

    tryMigrateMangaList()

    const mangaList: Manga[] = LocalStorage.getItem(this.$constants.MANGA_LIST_KEY) || []
    mangaList.sort(mangaSort)
    this.updateMangaList(mangaList)
  }
})
</script>
