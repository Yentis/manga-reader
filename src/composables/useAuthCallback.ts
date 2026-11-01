import { NotifyOptions } from 'src/classes/notifyOptions'
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import qs from 'qs'
import { setAuth as setDropboxAuth } from '../services/dropboxService'
import type ElectronWindow from 'src/interfaces/electronWindow'
import { tryMigrateDropbox } from 'src/services/migrationService'
import { stateManager } from 'src/store/store-reader'

export function useAuth(): { onDropboxRedirect: (queryString?: qs.ParsedQs) => void } {
  const { notification$ } = stateManager

  const onDropboxRedirect = (queryString?: qs.ParsedQs): void => {
    const notifyOptions = new NotifyOptions('Logged in successfully! Please import / export again')
    notifyOptions.type = 'positive'
    notification$.next(notifyOptions)

    setDropboxAuth(queryString)
  }

  return {
    onDropboxRedirect,
  }
}

export function useAppAuth(): void {
  onMounted(() => {
    tryMigrateDropbox()
  })
}

export function useElectronAuth(): void {
  const { onDropboxRedirect } = useAuth()

  onMounted(() => {
    const electronWindow = window as unknown as ElectronWindow

    electronWindow.mangaReader.onDropboxToken((_event, queryString) => {
      onDropboxRedirect(queryString)
    })
  })
}

export function useCapacitorAuth(): { onUrlLoadStart: (url: string) => qs.ParsedQs | undefined } {
  return {
    onUrlLoadStart: (url: string): qs.ParsedQs | undefined => {
      if (url.startsWith('http://localhost') && url.includes('code=')) {
        return qs.parse(url.substring(url.indexOf('code=')))
      }

      return undefined
    },
  }
}

export function useStaticAuth(): void {
  const { onDropboxRedirect } = useAuth()

  onMounted(() => {
    const $route = useRoute()
    const fullPath = $route.fullPath
    if (!fullPath.includes('code=')) return

    const queryString = qs.parse(fullPath.substring(fullPath.indexOf('code=')))
    onDropboxRedirect(queryString)
  })
}
