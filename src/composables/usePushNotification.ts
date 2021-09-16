import { useQuasar } from 'quasar'
import { Manga } from '../classes/manga'
import { UrlNavigation } from '../classes/urlNavigation'
import useSettings from './useSettings'
import useUrlNavigation from './useUrlNavigation'
import { watch } from 'vue'
import { Settings } from 'src/classes/settings'
import { getPlatform } from 'src/services/platformService'
import { Platform } from 'src/enums/platformEnum'

interface CordovaNotificationOptions {
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
    }
  }
}

export default function usePushNotification () {
  const $q = useQuasar()
  const { urlNavigation } = useUrlNavigation()

  const sendPushNotification = (manga: Manga) => {
    if ($q.platform.is.cordova) {
      (cordova.plugins as CordovaNotification).notification.local.schedule({
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
  }

  return { sendPushNotification }
}

export function useAppPushNotification () {
  const { settings } = useSettings()

  watch(settings, (newSettings: Settings) => {
    if (getPlatform() !== Platform.Static) return
    if (!newSettings.refreshOptions.enabled) return
    if (Notification.permission === 'denied') return

    Notification.requestPermission().catch((error) => console.error(error))
  })
}
