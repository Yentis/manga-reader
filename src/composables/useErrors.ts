import { useStore } from '../store'
import { computed } from 'vue'
import { NotifyOptions } from 'src/classes/notifyOptions'

export default function useErrors () {
  const $store = useStore()
  const errors = computed(() => $store.state.reader.errors)

  return {
    errors,
    addError: (error: NotifyOptions) => { $store.commit('reader/addError', error) },
    clearErrors: () => { $store.commit('reader/updateErrors', []) }
  }
}
