/// <reference types="cordova-plugin-inappbrowser" />

import { useStore } from '../store/index'
import { computed, watch } from 'vue'
import { UrlNavigation } from '../classes/urlNavigation'
import { openURL } from 'quasar'
import useSettings from './useSettings'
import { useAuth, useCordovaAuth } from './useAuthCallback'
import ElectronWindow from 'src/interfaces/electronWindow'
import { checkSites } from 'src/services/siteService'
import { getPlatform } from 'src/services/platformService'
import { Platform } from 'src/enums/platformEnum'

export default function useUrlNavigation () {
  const $store = useStore()
  const urlNavigation = computed({
    get: () => $store.state.reader.urlNavigation,
    set: (val) => $store.commit('reader/pushUrlNavigation', val)
  })

  const navigate = (url: string, openInApp = false) => {
    urlNavigation.value = new UrlNavigation(url, openInApp)
  }

  return { urlNavigation, navigate }
}

export function useAppUrlNavigation () {
  const { urlNavigation } = useUrlNavigation()
  const { settings } = useSettings()
  const { onDropboxRedirect } = useAuth()
  const platform = getPlatform()

  const openInApp = (url: string, forced: boolean) => {
    if (platform !== Platform.Cordova) {
      window.location.href = url
      return
    }

    const { onUrlLoadStart } = useCordovaAuth()
    const browser = cordova.InAppBrowser.open(url, '_blank')
    if (!forced) return

    browser.addEventListener('exit', () => {
      checkSites()
    })

    browser.addEventListener('loadstart', (event) => {
      const token = onUrlLoadStart(event.url)
      if (!token) return

      browser.close()
      onDropboxRedirect(token)
    })
  }

  watch(urlNavigation, (target) => {
    if (!target) return
    if (platform === Platform.Static) {
      openURL(target.url)
      return
    }

    const openInBrowser = settings.value.openInBrowser

    if (target.openInApp || !openInBrowser) {
      openInApp(target.url, target.openInApp)
    } else if (platform === Platform.Cordova) {
      window.location.href = target.url
    } else if (platform === Platform.Electron) {
      const electronWindow = window as unknown as ElectronWindow
      electronWindow.mangaReader.openURL(target.url)
    }
  })
}
