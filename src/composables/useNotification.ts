import { useQuasar } from 'quasar'
import { useStore } from '../store'
import { computed, watch } from 'vue'
import useErrors from './useErrors'
import { NotifyOptions } from 'src/classes/notifyOptions'
import ErrorDialog from '../components/ErrorDialog.vue'

export default function useNotification () {
  const $store = useStore()
  const notification = computed({
    get: () => $store.state.reader.notification,
    set: (val) => $store.commit('reader/pushNotification', val)
  })

  return { notification }
}

export function useAppNotification () {
  const $q = useQuasar()
  const { notification } = useNotification()
  const { errors, addError, clearErrors } = useErrors()

  let dismissErrorNotification: (() => void) | undefined
  let errorDialogShowing = false

  watch(notification, () => {
    if (!notification.value) return

    if (notification.value.type !== 'negative') {
      $q.notify(notification.value.getOptions())
      return
    }

    const errorLength = errors.value.length
    addError(notification.value)
    console.error(notification.value.message)
    if (errorDialogShowing) return

    if (errorLength === 0) {
      dismissErrorNotification = $q.notify({
        ...notification.value.getOptions(),
        onDismiss: () => {
          if (errors.value.length > 1) return
          clearErrors()
        }
      }) as () => void
      return
    }

    if (dismissErrorNotification) dismissErrorNotification()
    let dismiss: (() => void) | undefined

    const notifyOptions = new NotifyOptions('Issues detected')
    notifyOptions.position = 'bottom-right'
    notifyOptions.timeout = 0
    notifyOptions.actions = [{
      label: 'View',
      handler: () => {
        errorDialogShowing = true

        $q.dialog({
          component: ErrorDialog
        }).onDismiss(() => {
          clearErrors()
          errorDialogShowing = false
        })
      },
      color: 'white'
    }, {
      label: 'Close',
      handler: () => {
        if (!dismiss) return
        dismiss()
        dismiss = undefined
        clearErrors()
      },
      color: 'white'
    }]

    dismiss = $q.notify(notifyOptions.getOptions()) as () => void
  })
}
