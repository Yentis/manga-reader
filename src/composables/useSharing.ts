import { createList, getNotifyOptions, updateList } from '../services/rentryService'
import useNotification from './useNotification'
import useUrlNavigation from './useUrlNavigation'
import { useQuasar } from 'quasar'
import ConfirmationDialog from '../components/ConfirmationDialog.vue'
import { useStore } from 'src/store'

export default function useSharing() {
  const $q = useQuasar()
  const $store = useStore()
  const { urlNavigation } = useUrlNavigation()
  const { notification } = useNotification()

  const getRentryNotifyOptions = (error: unknown) => {
    return getNotifyOptions(error, urlNavigation)
  }

  const updateShareList = () => {
    updateList(JSON.stringify(Array.from($store.state.reader.mangaMap.values()))).catch((error) => {
      notification.value = getRentryNotifyOptions(error)
      console.error(error)
    })
  }

  let shareSyncInterval: ReturnType<typeof setInterval> | undefined
  const startShareSyncInterval = () => {
    if (shareSyncInterval !== undefined) {
      clearInterval(shareSyncInterval)
      shareSyncInterval = undefined
    }

    updateShareList()
    shareSyncInterval = setInterval(() => {
      updateShareList()
    }, 5 * 60 * 1000)
  }

  const showShareDialog = (): Promise<string> => {
    return new Promise((resolve) => {
      $q.dialog({
        component: ConfirmationDialog,
        componentProps: {
          title: 'List sharing',
          content:
            'Your list will be uploaded to Rentry and a shareable URL will be generated.\nThis shareable list will be updated periodically and whenever the app is opened.',
        },
      })
        .onOk(() => {
          createList(JSON.stringify(Array.from($store.state.reader.mangaMap)))
            .then((shareId) => {
              resolve(shareId)
            })
            .catch((error) => {
              notification.value = getRentryNotifyOptions(error)
              console.error(error)
              resolve('')
            })
        })
        .onCancel(() => {
          resolve('')
        })
    })
  }

  return { startShareSyncInterval, showShareDialog }
}
