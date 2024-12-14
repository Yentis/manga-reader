import { useStore } from 'src/store'
import { computed, onMounted, watch } from 'vue'
import useSharing from './useSharing'
import { getChangelog } from '../services/updateService'
import { LocalStorage, useQuasar } from 'quasar'
import ConfirmationDialog from '../components/ConfirmationDialog.vue'
import constants from 'src/classes/constants'
import { version } from '../../package.json'
import { useElectronAuth, useStaticAuth } from './useAuthCallback'
import { hasExtension } from 'src/classes/requests/browserRequest'
import useUpdate from './useUpdate'

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

  const checkInitialize = () => {
    if (main.value) return
    initialize().catch((error) => console.error(error))
    main.value = true
  }

  onMounted(checkInitialize)
  watch(main, checkInitialize)
}

export function useCapacitorInitialized () {
  const { main, clearInitialized } = useInitialized()

  onMounted(() => {
    document.addEventListener('resume', () => {
      if (!main.value) return
      clearInitialized()
    })
  })
}

export function useElectronInitialized () {
  useElectronAuth()
}

export function useStaticInitialized () {
  const $q = useQuasar()

  useStaticAuth()
  hasExtension().then((hasExtension) => {
    if (hasExtension) return

    $q.dialog({
      component: ConfirmationDialog,
      componentProps: {
        title: 'Extension missing or outdated',
        content: `To use this page it is required you download the latest Manga Reader chrome extension version

        After downloading:
        Open the extensions page
        Enable developer mode
        Extract the downloaded extension and select it with "Load unpacked"

        `,
        link: 'https://download-directory.github.io/?url=https%3A%2F%2Fgithub.com%2FYentis%2Fmanga-reader%2Ftree%2Fmaster%2Fsrc-extension',
        linkText: 'Download here',
        hideCancel: true
      }
    })
  }).catch((error) => console.error(error))
}
