import { NotifyOptions } from 'src/classes/notifyOptions'
import ElectronWindow from 'src/interfaces/electronWindow'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import useNotification from './useNotification'
import { useQuasar } from 'quasar'
import useMangaList from './useMangaList'
import useUrlNavigation from './useUrlNavigation'
import qs from 'qs'
import { setAccessToken as setDropboxAccessToken } from '../services/dropboxService'
import { createList, getNotifyOptions, setAccessToken as setGitlabAccessToken } from '../services/gitlabService'

function useAuth () {
  const $q = useQuasar()
  const { notification } = useNotification()
  const { mangaList } = useMangaList()
  const { urlNavigation } = useUrlNavigation()

  const onDropboxRedirect = (accessToken?: string) => {
    const notifyOptions = new NotifyOptions('Logged in successfully! Please import / export again')
    notifyOptions.type = 'positive'
    notification.value = notifyOptions

    setDropboxAccessToken(accessToken)
  }

  const onGitlabRedirect = (accessToken?: string) => {
    const notifyOptions = new NotifyOptions('Logged in successfully!')
    notifyOptions.type = 'positive'
    notification.value = notifyOptions

    setGitlabAccessToken(accessToken)

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

  return {
    onDropboxRedirect,
    onGitlabRedirect
  }
}

export function useElectronAuth () {
  const { onDropboxRedirect, onGitlabRedirect } = useAuth()

  onMounted(() => {
    const electronWindow = window as unknown as ElectronWindow

    electronWindow.mangaReader.onDropboxToken((_event: unknown, token?: string) => {
      onDropboxRedirect(token)
    })

    electronWindow.mangaReader.onGitlabToken((_event: unknown, token?: string) => {
      onGitlabRedirect(token)
    })
  })
}

export function useCordovaAuth () {
  const { onDropboxRedirect, onGitlabRedirect } = useAuth()

  const onUrlLoadStart = (url: string): boolean => {
    if (url.startsWith('http://localhost/redirect_gitlab')) {
      const queryString = qs.parse(url.replace('http://localhost/redirect_gitlab#', ''))
      const token = queryString.access_token as string
      onGitlabRedirect(token)
    } else if (url.startsWith('http://localhost/redirect#access_token')) {
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
  const { onDropboxRedirect, onGitlabRedirect } = useAuth()

  onMounted(() => {
    const $route = useRoute()
    const fullPath = $route.fullPath

    if (fullPath.startsWith('/#/redirect_gitlab')) {
      const queryString = qs.parse(fullPath.replace('/#/redirect_gitlab#', ''))
      const token = queryString.access_token as string
      onGitlabRedirect(token)
    } else if (fullPath.startsWith('/#/redirect')) {
      const queryString = qs.parse(fullPath.replace('/#/redirect#', ''))
      const token = queryString.access_token as string
      onDropboxRedirect(token)
    }
  })
}
