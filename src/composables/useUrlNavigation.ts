/// <reference types="cordova-plugin-inappbrowser" />

import { useStore } from '../store/index'
import { computed, watch } from 'vue'
import { UrlNavigation } from '../classes/urlNavigation'
import { openURL, useQuasar } from 'quasar'
import { checkSites } from '../services/siteService'
import useSettings from './useSettings'
import ElectronWindow from 'src/interfaces/electronWindow'
import { useCordovaAuth } from './useAuthCallback'

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
  const $q = useQuasar()
  const { urlNavigation } = useUrlNavigation()
  const { settings } = useSettings()

  const openInApp = (url: string, forced: boolean) => {
    if (!$q.platform.is.cordova) {
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
      const shouldClose = onUrlLoadStart(event.url)
      if (shouldClose) browser.close()
    })
  }

  watch(urlNavigation, (target) => {
    if (!target) return
    const openInBrowser = settings.value.openInBrowser

    if (target.openInApp || !openInBrowser) {
      openInApp(target.url, target.openInApp)
    } else if ($q.platform.is.cordova) {
      window.location.href = target.url
    } else if ($q.platform.is.electron) {
      const electronWindow = window as unknown as ElectronWindow
      electronWindow.mangaReader.openURL(target.url)
    } else {
      openURL(target.url)
    }
  })
}
