import { NotifyOptions } from 'src/classes/notifyOptions'
import ElectronWindow from 'src/interfaces/electronWindow'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import useNotification from './useNotification'
import qs from 'qs'
import { setAccessToken as setDropboxAccessToken } from '../services/dropboxService'

function useAuth () {
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
  const { onDropboxRedirect } = useAuth()

  const onUrlLoadStart = (url: string): boolean => {
    if (url.startsWith('http://localhost/redirect#access_token')) {
      const queryString = qs.parse(url.replace('http://localhost/redirect#', ''))
      const token = queryString.access_token as string
      onDropboxRedirect(token)
    } else return false

    return true
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

    if (fullPath.startsWith('/redirect#')) {
      const queryString = qs.parse(fullPath.replace('/redirect#', ''))
      const token = queryString.access_token as string
      onDropboxRedirect(token)
    }
  })
}
