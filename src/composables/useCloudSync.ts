import { useQuasar } from 'quasar'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { getAccessToken, getAuthUrl, readList, saveList } from 'src/services/dropboxService'
import useNotification from './useNotification'
import useUrlNavigation from './useUrlNavigation'
import ConfirmationDialog from '../components/ConfirmationDialog.vue'
import useMangaList from './useMangaList'
import { ReadListResponse } from '../services/dropboxService'
import { setEditCode, setShareId } from 'src/services/rentryService'
import { useStore } from 'src/store'
import { DropboxResponseError } from 'dropbox'

export default function useCloudSync () {
  const $q = useQuasar()
  const $store = useStore()
  const { urlNavigation } = useUrlNavigation()
  const { notification } = useNotification()
  const { setMangaList, storeManga } = useMangaList()

  const openDropboxLogin = () => {
    getAuthUrl().then((authUrl) => {
      urlNavigation.value = new UrlNavigation(authUrl, true)
    }).catch((error) => {
      notification.value = new NotifyOptions(error)
    })
  }

  const importList = async () => {
    if (!getAccessToken()) {
      openDropboxLogin()
      return
    }

    let readListResponse: ReadListResponse
    try {
      readListResponse = await readList()
    } catch (error: unknown) {
      if (error instanceof DropboxResponseError) {
        if (error.status === 401) {
          openDropboxLogin()
          return
        }

        notification.value = new NotifyOptions(`${error.status}: ${JSON.stringify(error.error)}`)
      } else if (error instanceof Error) {
        notification.value = new NotifyOptions(error)
      } else {
        notification.value = new NotifyOptions(error as string)
      }
    }

    return new Promise<void>((resolve) => {
      const { mangaList: storedMangaList, shareContents } = readListResponse

      $q.dialog({
        component: ConfirmationDialog,
        componentProps: {
          title: 'Import from Dropbox',
          content: `Are you sure you want to import ${storedMangaList.length} titles from Dropbox?\nYou currently have ${$store.state.reader.mangaMap.size} titles.`
        }
      }).onOk(() => {
        const notifyOptions = new NotifyOptions('Imported!')
        notifyOptions.type = 'positive'
        notification.value = notifyOptions

        setMangaList(storedMangaList)
        storeManga()

        if (!shareContents) {
          resolve()
          return
        }

        setShareId(shareContents.id)
        setEditCode(shareContents.editCode)

        resolve()
      }).onCancel(() => {
        resolve()
      })
    })
  }

  const exportList = async () => {
    if (!getAccessToken()) {
      openDropboxLogin()
      return
    }

    const mangaMap = $store.state.reader.mangaMap

    const confirmed = await new Promise<boolean>((resolve) => {
      $q.dialog({
        component: ConfirmationDialog,
        componentProps: {
          title: 'Export to Dropbox',
          content: `Are you sure you want to export ${mangaMap.size} titles to Dropbox?`
        }
      }).onOk(() => {
        resolve(true)
      }).onCancel(() => {
        resolve(false)
      })
    })

    if (!confirmed) return

    try {
      await saveList(Array.from(mangaMap.values()))

      const notifyOptions = new NotifyOptions('Exported!')
      notifyOptions.type = 'positive'
      notification.value = notifyOptions
    } catch (error: unknown) {
      if (error instanceof DropboxResponseError) {
        if (error.status === 401) {
          openDropboxLogin()
          return
        }

        notification.value = new NotifyOptions(`${error.status}: ${JSON.stringify(error.error)}`)
      } else if (error instanceof Error) {
        notification.value = new NotifyOptions(error)
      } else {
        notification.value = new NotifyOptions(error as string)
      }
    }
  }

  return { importList, exportList }
}
