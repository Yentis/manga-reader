import { Manga } from '../classes/manga'
import { UrlNavigation } from '../classes/urlNavigation'
import useSettings from './useSettings'
import useUrlNavigation from './useUrlNavigation'
import { watch, computed } from 'vue'
import { Settings } from 'src/classes/settings'
import { getPlatform } from 'src/services/platformService'
import { Platform } from 'src/enums/platformEnum'
import useMangaList from './useMangaList'
import { useStore } from 'src/store'

interface CordovaNotificationOptions {
  id: number
  title: string
  text: string
  icon: string
  smallIcon: string
  foreground: boolean
}

interface CordovaNotification {
  notification: {
    local: {
      schedule: (options: CordovaNotificationOptions) => void
      cancel: (id: number, callback: () => void) => void
      on: (event: string, callback: (notification?: CordovaNotificationOptions) => void) => void
    }
  }
}

export default function usePushNotification () {
  const $store = useStore()
  const { urlNavigation } = useUrlNavigation()

  const pushNotifications = computed(() => $store.state.reader.pushNotifications)
  const sendPushNotification = (manga: Manga) => {
    const randomNum = Math.random().toString()
    const id = parseInt(randomNum.substring(randomNum.indexOf('.') + 1))

    if (getPlatform() === Platform.Cordova) {
      const plugins = cordova.plugins as CordovaNotification
      plugins.notification.local.schedule({
        id,
        title: manga.title,
        text: manga.chapter,
        smallIcon: 'res://notification_icon',
        icon: manga.image,
        foreground: true
      })
    } else {
      const notification = new Notification(manga.title, {
        body: manga.chapter,
        icon: manga.image
      })

      notification.onclick = () => {
        urlNavigation.value = new UrlNavigation(manga.url, false)
      }
    }

    $store.commit('reader/addPushNotification', { url: manga.url, id })
  }

  const clearPushNotification = (url: string) => {
    const id = pushNotifications.value.get(url)
    if (!id) return

    if (getPlatform() === Platform.Cordova) {
      (cordova.plugins as CordovaNotification).notification.local.cancel(id, () => { /* Do nothing */ })
    }

    $store.commit('reader/removePushNotification', url)
  }

  const removePushNotification = (id: number) => {
    for (const [url, curId] of pushNotifications.value) {
      if (curId === id) {
        $store.commit('reader/removePushNotification', url)
        break
      }
    }
  }

  return {
    pushNotifications,
    sendPushNotification,
    clearPushNotification,
    removePushNotification
  }
}

export function useAppPushNotification () {
  const { settings } = useSettings()
  const { mangaMap } = useMangaList()
  const {
    pushNotifications,
    clearPushNotification,
    removePushNotification
  } = usePushNotification()

  if (getPlatform() === Platform.Cordova) {
    const plugins = cordova.plugins as CordovaNotification
    plugins.notification.local.on('clear', (notification) => {
      if (!notification) return
      removePushNotification(notification.id)
    })
  }

  watch(settings, (newSettings: Settings) => {
    if (getPlatform() !== Platform.Static) return
    if (!newSettings.refreshOptions.enabled) return
    if (Notification.permission === 'denied') return

    Notification.requestPermission().catch((error) => console.error(error))
  })

  watch(mangaMap, (newMangaMap: Map<string, Manga>) => {
    pushNotifications.value.forEach((_, url) => {
      if (!newMangaMap.get(url)) {
        clearPushNotification(url)
      }
    })
  })
}
