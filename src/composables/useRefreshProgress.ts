import { useStore } from '../store/index'
import { computed } from 'vue'

export default function useRefreshProgress () {
  const $store = useStore()
  const refreshProgress = computed({
    get: () => $store.state.reader.refreshProgress,
    set: (val) => $store.commit('reader/updateRefreshProgress', val)
  })

  const incrementRefreshProgress = (increment: number) => {
    refreshProgress.value += increment
  }

  return { refreshProgress, incrementRefreshProgress }
}
