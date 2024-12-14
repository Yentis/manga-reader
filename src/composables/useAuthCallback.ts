import { NotifyOptions } from 'src/classes/notifyOptions'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import useNotification from './useNotification'
import qs from 'qs'
import { setAuth as setDropboxAuth } from '../services/dropboxService'
import ElectronWindow from 'src/interfaces/electronWindow'
import { tryMigrateDropbox } from 'src/services/migrationService'

export function useAuth () {
  const { notification } = useNotification()

  const onDropboxRedirect = (queryString?: qs.ParsedQs) => {
    const notifyOptions = new NotifyOptions('Logged in successfully! Please import / export again')
    notifyOptions.type = 'positive'
    notification.value = notifyOptions

    setDropboxAuth(queryString)
  }

  return {
    onDropboxRedirect
  }
}

export function useAppAuth () {
  onMounted(() => {
    tryMigrateDropbox()
  })
}

export function useElectronAuth () {
  const { onDropboxRedirect } = useAuth()

  onMounted(() => {
    const electronWindow = window as unknown as ElectronWindow

    electronWindow.mangaReader.onDropboxToken((_event: unknown, queryString?: qs.ParsedQs) => {
      onDropboxRedirect(queryString)
    })
  })
}

export function useCapacitorAuth () {
  const onUrlLoadStart = (url: string): qs.ParsedQs | null => {
    if (url.startsWith('http://localhost') && url.includes('code=')) {
      const queryString = qs.parse(url.substring(url.indexOf('code=')))
      return queryString
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
    if (!fullPath.includes('code=')) return

    const queryString = qs.parse(fullPath.substring(fullPath.indexOf('code=')))
    onDropboxRedirect(queryString)
  })
}
