import { createList, getNotifyOptions, updateList } from '../services/rentryService'
import useMangaList from './useMangaList'
import useNotification from './useNotification'
import useUrlNavigation from './useUrlNavigation'
import { ref } from 'vue'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import { useQuasar } from 'quasar'
import ConfirmationDialog from '../components/ConfirmationDialog.vue'

export default function useSharing () {
  const $q = useQuasar()
  const { urlNavigation } = useUrlNavigation()
  const { mangaList } = useMangaList()
  const { notification } = useNotification()

  const getRentryNotifyOptions = (error: unknown) => {
    return getNotifyOptions(error, urlNavigation)
  }

  const updateShareList = () => {
    updateList(JSON.stringify(mangaList.value))
      .catch(error => {
        notification.value = getRentryNotifyOptions(error)
        console.error(error)
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
          content: 'Your list will be uploaded to Rentry and a shareable URL will be generated.\nThis shareable list will be updated periodically and whenever the app is opened.'
        }
      }).onOk(async () => {
        try {
          const shareId = await createList(JSON.stringify(mangaList.value))
          resolve(shareId)

          return
        } catch (error) {
          notification.value = getRentryNotifyOptions(error)
          console.error(error)
        }

        resolve('')
      }).onCancel(() => { resolve('') })
    })
  }

  return { startShareSyncInterval, showShareDialog }
}
