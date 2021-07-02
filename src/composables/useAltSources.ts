import { useQuasar } from 'quasar'
import { Ref } from 'vue'
import AltSourceDialog from '../components/AltSourceDialog.vue'
import useManga from './useManga'

export default function useAltSources (url: string, newSources: Ref<Record<string, string> | undefined>) {
  const $q = useQuasar()
  const { altSources, title } = useManga(url)

  const openAltSourceDialog = () => {
    $q.dialog({
      component: AltSourceDialog,
      componentProps: {
        sources: newSources.value || altSources.value || {},
        initialSearch: title.value,
        searchPlaceholder: 'Search for a manga',
        manualPlaceholder: 'Or enter the url manually',
        confirmButton: 'Confirm'
      }
    }).onOk((sources: Record<string, string>) => {
      newSources.value = sources
    })
  }

  const saveSources = (): boolean => {
    if (newSources.value === undefined) return false

    altSources.value = newSources.value
    return true
  }

  return { saveSources, openAltSourceDialog }
}
