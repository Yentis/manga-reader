import { useQuasar } from 'quasar'
import { Manga } from '../classes/manga'
import { UrlNavigation } from '../classes/urlNavigation'
import useUrlNavigation from './useUrlNavigation'

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
    if ($q.platform.is.electron) {
      const notification = new Notification(manga.title, {
        body: manga.chapter,
        icon: manga.image
      })

      notification.onclick = () => {
        urlNavigation.value = new UrlNavigation(manga.url, false)
      }
    } else if ($q.platform.is.mobile) {
      (cordova.plugins as CordovaNotification).notification.local.schedule({
        title: manga.title,
        text: manga.chapter,
        smallIcon: 'res://notification_icon',
        icon: manga.image,
        foreground: true
      })
    }
  }

  return { sendPushNotification }
}
