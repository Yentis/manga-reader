<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Link with external sites</q-toolbar-title>
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-toolbar>

      <div class="q-mx-md q-mt-md text-body2">
        This will sync your read chapter with the selected site.
        <br>
        Note: the manga MUST be in your library on the selected site.
      </div>

      <q-table
        v-model:selected="selected"
        :rows="rows"
        class="q-mt-sm"
        selection="single"
        hide-header
        hide-bottom
        dense
        separator="none"
        row-key="name"
      >
        <template #body-cell-id="props">
          <q-td :props="props">
            <q-btn
              v-if="props.value && !props.row.deleted"
              flat
              class="full-width"
              color="positive"
              icon="link"
              @click="setLinkDeleted(props.row.value, true)"
            />
            <q-btn
              v-else
              flat
              :disable="!props.value"
              class="full-width"
              color="negative"
              icon="link_off"
              @click="setLinkDeleted(props.row.value, false)"
            />
          </q-td>
        </template>
        <template #body-cell-deleted />
      </q-table>

      <MangaSearch
        v-model:url="url"
        class="q-pt-none"
        :search-placeholder="searchPlaceholder"
        :manual-placeholder="manualPlaceholder"
        :initial-search="initialSearch"
        :site-type="selected.length > 0 ? selected[0].value : linkingSiteType.MangaDex"
      />

      <q-card-actions>
        <q-space />

        <q-btn
          color="primary"
          :disable="selected.length === 0"
          :label="confirmButton"
          @click="onOKClick"
        />
        <q-btn
          v-close-popup
          label="Cancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { useDialogPluginComponent } from 'quasar'
import { defineComponent, ref, Ref, onMounted } from 'vue'
import { SiteName } from 'src/enums/siteEnum'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import MangaSearch from './SearchComponent.vue'
import { useClearingSearchResults } from 'src/composables/useSearchResults'

interface Rows {
  name: SiteName,
  value: string,
  id: number | string,
  deleted: boolean
}

export default defineComponent({
  components: {
    MangaSearch
  },

  props: {
    linkedSites: {
      type: Object,
      required: true
    },
    initialSearch: {
      type: String,
      default: ''
    },
    searchPlaceholder: {
      type: String,
      default: ''
    },
    manualPlaceholder: {
      type: String,
      default: ''
    },
    confirmButton: {
      type: String,
      default: ''
    }
  },

  emits: [...useDialogPluginComponent.emits],

  setup (props) {
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    const { clearSearchResults } = useClearingSearchResults()

    const rows: Ref<Rows[]> = ref([])
    const getRows = () => {
      rows.value = Object.values(LinkingSiteType).map(site => {
        const linkedSites: Record<string, number> = props.linkedSites
        const id = linkedSites ? linkedSites[site] : ''

        return {
          name: SiteName[site],
          value: site,
          id,
          deleted: false
        }
      })
    }
    onMounted(getRows)

    const url = ref('')
    const selected = ref([{
      name: SiteName[LinkingSiteType.MangaDex],
      value: LinkingSiteType.MangaDex
    }])

    const getLinkedSites = () => {
      const linkedSites: Record<string, number> = {}
      rows.value.filter(site => site.id && !site.deleted).forEach(site => {
        if (typeof site.id === 'number') {
          linkedSites[site.value] = site.id
        }
      })

      return linkedSites
    }

    const setLinkDeleted = (siteType: string, enabled: boolean) => {
      const index = rows.value.findIndex(site => site.value === siteType)
      if (index === -1) return
      rows.value[index].deleted = enabled
    }

    return {
      dialogRef,
      onDialogHide: () => {
        clearSearchResults()
        onDialogHide()
      },
      onOKClick: () => {
        onDialogOK({
          url: url.value,
          siteType: selected.value[0].value,
          linkedSites: getLinkedSites()
        })
      },
      onCancelClick: onDialogCancel,
      linkingSiteType: LinkingSiteType,
      rows,
      url,
      selected,
      setLinkDeleted
    }
  }
})
</script>

<style lang="scss" scoped>

.content {
  white-space: pre-wrap;
}

</style>
