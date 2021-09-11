import { UrlNavigation } from '../classes/urlNavigation'
import { createList, getAuthUrl, getNotifyOptions, setShareId, updateList } from '../services/gitlabService'
import useMangaList from './useMangaList'
import useNotification from './useNotification'
import useUrlNavigation from './useUrlNavigation'
import { ref, Ref } from 'vue'
import { useQuasar } from 'quasar'
import ConfirmationDialog from '../components/ConfirmationDialog.vue'

export default function useSharing () {
  const $q = useQuasar()
  const { urlNavigation } = useUrlNavigation()
  const { mangaList } = useMangaList()
  const { notification } = useNotification()

  const getGitlabNotifyOptions = (error: unknown) => {
    return getNotifyOptions(error, urlNavigation)
  }

  const updateShareList = () => {
    updateList(JSON.stringify(mangaList.value))
      .catch(error => {
        const notifyOptions = getGitlabNotifyOptions(error)

        if (notifyOptions.caption?.includes('404') || notifyOptions.caption?.includes('id is invalid')) {
          setShareId('')
          return
        } else if (notifyOptions.caption?.includes('spam')) {
          return
        }

        const actions = notifyOptions.actions || []
        if (notifyOptions.caption?.includes('401 Unauthorized') || notifyOptions.caption?.includes('Not logged in')) {
          actions.push(
            {
              label: 'Relog',
              handler: () => {
                urlNavigation.value = new UrlNavigation(getAuthUrl($q), true)
              },
              color: 'white'
            }
          )
        }

        notifyOptions.actions = actions
        notification.value = notifyOptions
      })
  }

  const shareSyncInterval: Ref<ReturnType<typeof setInterval> | undefined> = ref()
  const startShareSyncInterval = () => {
    if (shareSyncInterval.value !== undefined) {
      clearInterval(shareSyncInterval.value)
      shareSyncInterval.value = undefined
    }

    updateShareList()
    shareSyncInterval.value = setInterval(() => {
      updateShareList()
    }, 5 * 60 * 1000)
  }

  const showShareDialog = (): Promise<string> => {
    return new Promise((resolve) => {
      $q.dialog({
        component: ConfirmationDialog,
        componentProps: {
          title: 'List sharing',
          content: 'Your list will be uploaded to Gitlab as a Snippet and a shareable URL will be generated.\nThis shareable list will be updated periodically and whenever the app is opened.'
        }
      }).onOk(async () => {
        try {
          const shareId = await createList(JSON.stringify(mangaList.value))
          resolve(shareId)

          return
        } catch (error) {
          const notifyOptions = getGitlabNotifyOptions(error)

          if (notifyOptions.caption?.includes('Not logged in')) {
            urlNavigation.value = new UrlNavigation(getAuthUrl($q), true)
          } else {
            notification.value = notifyOptions
            console.error(error)
          }
        }

        resolve('')
      }).onCancel(() => { resolve('') })
    })
  }

  return { startShareSyncInterval, showShareDialog }
}
