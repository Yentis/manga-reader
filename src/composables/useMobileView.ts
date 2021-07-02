import { useStore } from '../store/index'
import { computed } from 'vue'

export default function useMobileView () {
  const $store = useStore()
  const mobileView = computed({
    get: () => $store.state.reader.mobileView,
    set: (val) => $store.commit('reader/updateMobileView', val)
  })

  return { mobileView }
}
