import { useQuasar } from 'quasar'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import AltSourceDialog from '../components/AltSourceDialog.vue'

export default function useAltSources (
  altSources: Ref<Record<string, string>>,
  title: Ref<string>,
  newSources: Ref<Record<string, string> | undefined>
) {
  const $q = useQuasar()

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
