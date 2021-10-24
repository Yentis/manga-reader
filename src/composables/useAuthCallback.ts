import { NotifyOptions } from 'src/classes/notifyOptions'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import useNotification from './useNotification'
import qs from 'qs'
import { setAccessToken as setDropboxAccessToken } from '../services/dropboxService'
import ElectronWindow from 'src/interfaces/electronWindow'

export function useAuth () {
  const { notification } = useNotification()

  const onDropboxRedirect = (accessToken?: string) => {
    const notifyOptions = new NotifyOptions('Logged in successfully! Please import / export again')
    notifyOptions.type = 'positive'
    notification.value = notifyOptions

    setDropboxAccessToken(accessToken)
  }

  return {
    onDropboxRedirect
  }
}

export function useElectronAuth () {
  const { onDropboxRedirect } = useAuth()

  onMounted(() => {
    const electronWindow = window as unknown as ElectronWindow

    electronWindow.mangaReader.onDropboxToken((_event: unknown, token?: string) => {
      onDropboxRedirect(token)
    })
  })
}

export function useCordovaAuth () {
  const onUrlLoadStart = (url: string): string | null => {
    if (url.startsWith('http://localhost') && url.includes('access_token=')) {
      const queryString = qs.parse(url.substring(url.indexOf('access_token=')))
      return queryString.access_token as string
    }

    return null
  }

  return {
    onUrlLoadStart
  }
}

export function useStaticAuth () {
  const { onDropboxRedirect } = useAuth()

  onMounted(() => {
    const $route = useRoute()
    const fullPath = $route.fullPath
    if (!fullPath.includes('access_token=')) return

    const queryString = qs.parse(fullPath.substring(fullPath.indexOf('access_token=')))
    const token = queryString.access_token as string
    onDropboxRedirect(token)
  })
}
