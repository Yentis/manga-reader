import { useQuasar } from 'quasar'
import { useStore } from '../store'
import { computed, watchEffect } from 'vue'

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

  watchEffect(() => {
    if (!notification.value) return

    if (notification.value.message instanceof Error) {
      console.error(notification.value.message)
    }

    $q.notify(notification.value.getOptions())
  })
}
