import { Ref, ref, onMounted, nextTick, watch } from 'vue'
import WindowSize from '../classes/windowSize'
import useMobileView from './useMobileView'

export default function useWindowSize () {
  const windowSize: Ref<WindowSize> = ref(new WindowSize())
  const getWindowSize = () => {
    windowSize.value = new WindowSize(window.innerWidth, window.innerHeight)
  }

  onMounted(async () => {
    getWindowSize()
    await nextTick()
    window.addEventListener('resize', getWindowSize)
  })

  return { windowSize }
}

export function useAppWindowSize () {
  const { windowSize } = useWindowSize()
  const { mobileView } = useMobileView()
  const getMobileView = (newWindowSize: WindowSize) => {
    mobileView.value = newWindowSize.x <= 850
  }

  onMounted(() => { getMobileView(windowSize.value) })
  watch(windowSize, getMobileView)
}
