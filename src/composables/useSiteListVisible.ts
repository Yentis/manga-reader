import { ref, watch, onMounted } from 'vue'
import useWindowSize from './useWindowSize'
import useMobileView from './useMobileView'

export default function useSiteListVisible () {
  const { windowSize } = useWindowSize()
  const { mobileView } = useMobileView()

  const visible = ref(true)
  const getVisible = () => {
    if (windowSize.value.x <= 700 && !mobileView.value) visible.value = false
    else if (windowSize.value.y <= 500 && mobileView.value) visible.value = false
    else visible.value = true
  }

  onMounted(getVisible)
  watch(windowSize, getVisible)

  return { mobileView, visible }
}
