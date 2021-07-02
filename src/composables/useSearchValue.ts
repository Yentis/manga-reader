import { useStore } from '../store/index'
import { computed } from 'vue'

export default function useSearchValue () {
  const $store = useStore()
  const searchValue = computed({
    get: () => $store.state.reader.searchValue,
    set: (val) => $store.commit('reader/updateSearchValue', val)
  })

  return { searchValue }
}
