import { useStore } from '../store/index'
import { computed, watchEffect, onMounted } from 'vue'
import { getChangelog } from '../services/updateService'
import { LocalStorage, useQuasar } from 'quasar'
import ConfirmationDialog from '../components/ConfirmationDialog.vue'
import { version } from '../../package.json'
import useUpdate from './useUpdate'
import useSharing from './useSharing'
import constants from 'src/classes/constants'

export default function useInitialized () {
  const $store = useStore()

  const main = computed({
    get: () => $store.state.initialized.main,
    set: (val) => $store.commit('initialized/updateMain', val)
  })
  const siteState = computed({
    get: () => $store.state.initialized.siteState,
    set: (val) => $store.commit('initialized/updateSiteState', val)
  })
  const clearInitialized = () => {
    main.value = false
    siteState.value = false
  }

  return { main, siteState, clearInitialized }
}

export function useAppInitialized () {
  const $q = useQuasar()
  const { main, clearInitialized } = useInitialized()
  const { doUpdateCheck } = useUpdate()
  const { startShareSyncInterval } = useSharing()

  onMounted(clearInitialized)

  const initialize = async () => {
    doUpdateCheck()

    const changelog = await getChangelog()
    if (changelog) {
      $q.dialog({
        component: ConfirmationDialog,
        componentProps: {
          title: 'Changelog',
          content: changelog,
          hideCancel: true
        }
      }).onDismiss(() => {
        LocalStorage.set(constants.MIGRATION_VERSION, version)
      })
    }

    startShareSyncInterval()
  }

  watchEffect(() => {
    if (main.value) return
    initialize().catch((error) => console.error(error))
    main.value = true
  })
}
