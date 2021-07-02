/// <reference types="cordova-plugin-inappbrowser" />

import { useStore } from '../store/index'
import { computed, watch } from 'vue'
import { UrlNavigation } from '../classes/urlNavigation'
import { openURL, useQuasar } from 'quasar'
import { checkSites } from '../services/siteService'
import { NotifyOptions } from '../classes/notifyOptions'
import qs from 'qs'
import { createList, getNotifyOptions, setAccessToken as setGitlabAccessToken } from '../services/gitlabService'
import { setAccessToken as setDropboxAccessToken } from '../services/dropboxService'
import useNotification from './useNotification'
import useMangaList from './useMangaList'
import useSettings from './useSettings'
import ElectronWindow from 'src/interfaces/electronWindow'

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
  const { notification } = useNotification()
  const { mangaList } = useMangaList()
  const { settings } = useSettings()

  const onGitlabRedirect = (url: string) => {
    const notifyOptions = new NotifyOptions('Logged in successfully!')
    notifyOptions.type = 'positive'
    notification.value = notifyOptions

    const queryString = qs.parse(url.replace('http://localhost/redirect_gitlab#', ''))
    setGitlabAccessToken(queryString.access_token as string)

    $q.loading.show({
      delay: 100
    })

    createList(JSON.stringify(mangaList.value))
      .catch(error => {
        notification.value = getNotifyOptions(error, urlNavigation)
      })
      .finally(() => {
        $q.loading.hide()
      })
  }

  const onDropboxRedirect = (url: string) => {
    const notifyOptions = new NotifyOptions('Logged in successfully! Please import / export again')
    notifyOptions.type = 'positive'
    notification.value = notifyOptions

    const queryString = qs.parse(url.replace('http://localhost/redirect#', ''))
    setDropboxAccessToken(queryString.access_token as string)
  }

  const openInApp = (url: string, forced: boolean) => {
    if (!$q.platform.is.mobile) {
      window.location.href = url
      return
    }

    const browser = cordova.InAppBrowser.open(url)
    if (!forced) return

    browser.addEventListener('exit', () => {
      checkSites()
    })

    browser.addEventListener('loadstart', (event) => {
      if (event.url.startsWith('http://localhost/redirect_gitlab')) {
        onGitlabRedirect(event.url)
      } else if (event.url.startsWith('http://localhost/redirect#access_token')) {
        onDropboxRedirect(event.url)
      } else return

      browser.close()
    })
  }

  watch(urlNavigation, (target) => {
    if (!target) return
    const openInBrowser = settings.value.openInBrowser

    if (target.openInApp || !openInBrowser) {
      openInApp(target.url, target.openInApp)
    } else if ($q.platform.is.mobile) {
      window.location.href = target.url
    } else if ($q.platform.is.electron) {
      const electronWindow = window as unknown as ElectronWindow
      electronWindow.mangaReader.openURL(target.url)
    } else {
      openURL(target.url)
    }
  })
}
