import { useQuasar } from 'quasar'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { getAccessToken, getAuthUrl, readList, saveList } from 'src/services/dropboxService'
import useNotification from './useNotification'
import useUrlNavigation from './useUrlNavigation'
import ConfirmationDialog from '../components/ConfirmationDialog.vue'
import useMangaList from './useMangaList'
import { Manga } from 'src/classes/manga'

export default function useCloudSync () {
  const $q = useQuasar()
  const { urlNavigation } = useUrlNavigation()
  const { notification } = useNotification()
  const { mangaList, storeManga } = useMangaList()

  const openDropboxLogin = () => {
    getAuthUrl($q).then((authUrl) => {
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

    let storedMangaList: Manga[]
    try {
      storedMangaList = await readList()
    } catch (error) {
      if (error instanceof Error && error.message === 'Unauthorized') {
        openDropboxLogin()
        return
      }

      notification.value = new NotifyOptions(error)
      return
    }

    return new Promise<void>((resolve) => {
      $q.dialog({
        component: ConfirmationDialog,
        componentProps: {
          title: 'Import from Dropbox',
          content: `Are you sure you want to import ${storedMangaList.length} titles from Dropbox?\nYou currently have ${mangaList.value.length} titles.`
        }
      }).onOk(() => {
        const notifyOptions = new NotifyOptions('Imported!')
        notifyOptions.type = 'positive'
        notification.value = notifyOptions

        mangaList.value = storedMangaList
        storeManga()

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
      $q.dialog({
        component: ConfirmationDialog,
        componentProps: {
          title: 'Export to Dropbox',
          content: `Are you sure you want to export ${mangaList.value.length} titles to Dropbox?`
        }
      }).onOk(async () => {
        try {
          await saveList(mangaList.value)
        } catch (error) {
          if (error instanceof Error && error.message === 'Unauthorized') {
            openDropboxLogin()
            resolve()
            return
          }

          notification.value = new NotifyOptions(error)
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
