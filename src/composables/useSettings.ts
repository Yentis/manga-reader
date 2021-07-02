import { useStore } from '../store/index'
import { computed, watch, onMounted } from 'vue'
import { Settings } from '../classes/settings'
import { LocalStorage, useQuasar } from 'quasar'
import useMangaList from './useMangaList'
import { tryMigrateSettings } from '../services/migrationService'
import SettingsDialog from '../components/SettingsDialog.vue'
import { SortType } from 'src/enums/sortingEnum'
import { Status } from 'src/enums/statusEnum'
import constants from 'src/classes/constants'

export default function useSettings () {
  const $store = useStore()
  const settings = computed({
    get: () => $store.state.reader.settings,
    set: (val) => $store.commit('reader/updateSettings', val)
  })

  const $q = useQuasar()
  const showSettingsDialog = () => {
    $q.dialog({
      component: SettingsDialog
    })
  }

  const setSortedBy = (sortType: SortType) => {
    const newSettings = Settings.clone(settings.value)
    newSettings.sortedBy = sortType

    settings.value = newSettings
  }

  const setFilters = (filters: Status[]) => {
    const newSettings = Settings.clone(settings.value)
    newSettings.filters = filters

    settings.value = newSettings
  }

  return {
    settings,
    showSettingsDialog,
    setSortedBy,
    setFilters
  }
}

export function useAppSettings () {
  const $q = useQuasar()
  const { settings } = useSettings()
  const { sortMangaList } = useMangaList()

  onMounted(() => {
    tryMigrateSettings()

    const localSettings: Settings = LocalStorage.getItem(constants.SETTINGS) || new Settings()
    settings.value = localSettings
  })

  const applySettings = (newSettings: Settings, oldSettings?: Settings) => {
    if (newSettings.darkMode !== $q.dark.isActive) {
      $q.dark.set(newSettings.darkMode)
    }

    if (newSettings.sortedBy !== oldSettings?.sortedBy || newSettings.filters !== oldSettings?.filters) {
      sortMangaList()
    }
  }
  applySettings(settings.value)

  watch(settings, (newSettings, oldSettings) => {
    newSettings = Settings.clone(newSettings)
    if (newSettings.equals(oldSettings)) return

    applySettings(newSettings, oldSettings)

    LocalStorage.set(constants.SETTINGS, newSettings)
  })
}
