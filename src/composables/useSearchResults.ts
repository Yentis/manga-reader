import { useStore } from '../store/index'
import { computed, onMounted } from 'vue'

export function useClearingSearchResults () {
  const { searchResults } = useSearchResults()

  const clearSearchResults = () => {
    searchResults.value = []
  }

  onMounted(clearSearchResults)

  return { clearSearchResults }
}

export function useSearchResults () {
  const $store = useStore()
  const searchResults = computed({
    get: () => $store.state.reader.searchResults,
    set: (val) => $store.commit('reader/updateSearchResults', val)
  })

  return { searchResults }
}
