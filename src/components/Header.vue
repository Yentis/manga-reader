<template>
  <div>
    <div class="header">
      <div>
        <q-btn
          class="q-mr-sm"
          color="secondary"
          icon="add"
          @click="onAddManga"
        />
        <q-btn
          color="primary"
          icon="refresh"
          @click="refreshAllManga()"
        />
      </div>
      <div>
        <q-btn
          class="q-mr-sm"
          color="primary"
          icon="backup"
          :loading="exporting"
          :disable="importing"
          @click="onExportList"
        />
        <q-btn
          color="primary"
          icon="cloud_download"
          :loading="importing"
          :disable="exporting"
          @click="onImportList"
        />
      </div>
      <q-btn
        flat
        round
        icon="settings"
        @click="showSettingsDialog"
      />
    </div>

    <div>
      <q-input
        v-model="searchValue"
        dense
        outlined
        class="q-mb-sm full-width"
      >
        <template #append>
          <q-icon
            v-if="searchValue === ''"
            name="search"
          />
          <q-icon
            v-else
            name="clear"
            class="cursor-pointer"
            @click="searchValue = ''"
          />
        </template>
      </q-input>

      <q-btn-dropdown
        no-caps
        class="q-mr-sm"
        :label="'Sort by: ' + settings.sortedBy"
      >
        <q-list
          v-for="type in sortTypes"
          :key="type"
        >
          <q-item
            v-close-popup
            clickable
            @click="setSortedBy(type)"
          >
            <q-item-section>
              <q-item-label>{{ type }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-btn-dropdown>

      <q-btn-dropdown
        no-caps
        label="Filters"
        @update:model-value="setFilters(newFilters)"
      >
        <q-option-group
          v-model="newFilters"
          class="q-mr-sm"
          type="checkbox"
          :options="statusList"
        />
      </q-btn-dropdown>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted, Ref } from 'vue'
import { Status } from 'src/enums/statusEnum'
import { SortType } from 'src/enums/sortingEnum'
import { Settings } from 'src/classes/settings'
import useSettings from 'src/composables/useSettings'
import useRefreshing from 'src/composables/useRefreshing'
import useMangaList from 'src/composables/useMangaList'
import useMobileView from 'src/composables/useMobileView'
import useSearchValue from 'src/composables/useSearchValue'
import useCloudSync from 'src/composables/useCloudSync'

export default defineComponent({
  name: 'MangaHeader',

  setup () {
    const { importList, exportList } = useCloudSync()

    const {
      addManga,
      storeManga,
      showAddMangaDialog,
      fetchManga
    } = useMangaList()

    const {
      refreshing,
      refreshInterval,
      createRefreshInterval,
      refreshAllManga
    } = useRefreshing()

    const onAddManga = async () => {
      const url = await showAddMangaDialog()
      if (url === null) return

      refreshing.value = true
      const manga = await fetchManga(url)
      refreshing.value = false
      if (manga === null) return

      const added = addManga(manga)
      if (added) {
        storeManga()
      }
      refreshing.value = false
    }

    const newFilters: Ref<Status[]> = ref([])
    const {
      settings,
      showSettingsDialog,
      setSortedBy,
      setFilters
    } = useSettings()

    onMounted(() => {
      createRefreshInterval(settings.value.refreshOptions)
      newFilters.value = settings.value.filters
    })

    watch(settings, (newSettings: Settings) => {
      if (refreshInterval.value !== undefined) {
        clearInterval(refreshInterval.value)
        refreshInterval.value = undefined
      }

      createRefreshInterval(newSettings.refreshOptions)
    })

    const importing = ref(false)
    const onImportList = () => {
      importing.value = true

      importList().finally(() => {
        importing.value = false
      })
    }

    const exporting = ref(false)
    const onExportList = () => {
      exporting.value = true

      exportList().finally(() => {
        exporting.value = false
      })
    }

    const { mobileView } = useMobileView()
    const { searchValue } = useSearchValue()
    const statusList = Object.values(Status)
      .map(value => {
        return {
          label: value,
          value: value
        }
      })

    return {
      sortTypes: SortType,
      status: Status,

      mobileView,
      searchValue,
      statusList,

      importing,
      exporting,
      onImportList,
      onExportList,

      newFilters,
      settings,
      showSettingsDialog,
      setSortedBy,
      setFilters,

      onAddManga,
      refreshAllManga
    }
  }
})
</script>

<style lang="scss" scoped>

.header {
  display: flex;
  justify-content: space-between;
}

.flex-column-between button {
  width: 100%;
}

</style>
