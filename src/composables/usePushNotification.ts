import { Manga } from '../classes/manga'
import { UrlNavigation } from '../classes/urlNavigation'
import useSettings from './useSettings'
import useUrlNavigation from './useUrlNavigation'
import { computed, watch } from 'vue'
import { Settings } from 'src/classes/settings'
import { getPlatform } from 'src/services/platformService'
import { Platform } from 'src/enums/platformEnum'
import useMangaList from './useMangaList'
import { useStore } from 'src/store'
import { LocalNotifications } from '@capacitor/local-notifications'

export default function usePushNotification () {
  const $store = useStore()
  const { urlNavigation } = useUrlNavigation()

  const pushNotifications = computed(() => $store.state.reader.pushNotifications)
  const sendPushNotification = (manga: Manga) => {
    const randomNum = Math.random().toString()
    // Substring first 9 chars to stay under Java max int
    const id = parseInt(randomNum.substring(randomNum.indexOf('.') + 1).substring(0, 9))

    if (getPlatform() === Platform.Capacitor) {
      LocalNotifications.schedule({
        notifications: [{
          id,
          title: manga.title,
          smallIcon: 'notification_icon',
          // TODO: Patched https://github.com/ionic-team/capacitor-plugins/issues/430
          largeIcon: manga.image,
          body: manga.chapter,
        }]
      }).catch(console.error)
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

    if (getPlatform() === Platform.Capacitor) {
      LocalNotifications.cancel({ notifications: [{ id }] }).catch(console.error)
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

  if (getPlatform() === Platform.Capacitor) {
    LocalNotifications.addListener('localNotificationActionPerformed', (actionPerformed) => {
      removePushNotification(actionPerformed.notification.id)
    }).catch(console.error)
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
