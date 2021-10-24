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
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        openDropboxLogin()
        return
      }

      notification.value = new NotifyOptions(error as string)
      return
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

  const exportList = () => {
    if (!getAccessToken()) {
      openDropboxLogin()
      return Promise.resolve()
    }

    return new Promise<void>((resolve) => {
      const mangaMap = $store.state.reader.mangaMap

      $q.dialog({
        component: ConfirmationDialog,
        componentProps: {
          title: 'Export to Dropbox',
          content: `Are you sure you want to export ${mangaMap.size} titles to Dropbox?`
        }
      }).onOk(async () => {
        try {
          await saveList(Array.from(mangaMap.values()))
        } catch (error) {
          if (error instanceof Error && error.message === 'Unauthorized') {
            openDropboxLogin()
            resolve()
            return
          }

          notification.value = new NotifyOptions(error as string)
          resolve()
          return
        }

        const notifyOptions = new NotifyOptions('Exported!')
        notifyOptions.type = 'positive'
        notification.value = notifyOptions
        resolve()
      }).onCancel(() => {
        resolve()
      })
    })
  }

  return { importList, exportList }
}
