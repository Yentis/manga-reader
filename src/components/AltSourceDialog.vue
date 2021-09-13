<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Add alternate sources</q-toolbar-title>
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-toolbar>

      <div class="q-mx-md q-mt-md text-body2">
        This will let you add additional sources for your manga.
        These will be used if your main source cannot be loaded.
      </div>

      <q-list
        v-if="data.length > 0"
        class="q-mt-sm"
        bordered
      >
        <q-item
          v-for="source in data"
          :key="source.url"
        >
          <q-item-section>
            <q-item-label>
              {{ source.name }}
            </q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              flat
              color="negative"
              icon="delete"
              @click="removeUrl(source.url)"
            />
          </q-item-section>
        </q-item>
      </q-list>

      <q-card-actions>
        <q-space />

        <q-btn
          flat
          class="q-pr-xs"
          color="positive"
          icon="add"
          @click="showAddDialog"
        />
      </q-card-actions>

      <q-card-actions>
        <q-space />

        <q-btn
          color="primary"
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
import { useDialogPluginComponent, useQuasar } from 'quasar'
import { defineComponent, ref, onMounted } from 'vue'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import { SiteName, SiteType } from 'src/enums/siteEnum'
import { NotifyOptions } from 'src/classes/notifyOptions'
import SearchDialog from './SearchDialog.vue'
import { useClearingSearchResults } from 'src/composables/useSearchResults'
import useNotification from 'src/composables/useNotification'
import { getSiteByUrl } from 'src/services/siteService'

export default defineComponent({
  props: {
    sources: {
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
    const { notification } = useNotification()

    const data: Ref<{ name: SiteName, site: SiteType, url: string }[]> = ref([])
    const sources: Ref<Record<string, string>> = ref(props.sources)

    const getSources = () => {
      sources.value = {}
      data.value.forEach(item => {
        sources.value[item.site] = item.url
      })
    }

    const getData = () => {
      data.value = Object.keys(sources.value).map(source => {
        const siteType = source as SiteType

        return {
          name: SiteName[siteType],
          site: siteType,
          url: sources.value[source]
        }
      })
    }
    onMounted(getData)

    const $q = useQuasar()
    const showAddDialog = () => {
      $q.dialog({
        component: SearchDialog,
        componentProps: {
          title: 'Add manga',
          initialSearch: props.initialSearch,
          searchPlaceholder: props.searchPlaceholder,
          manualPlaceholder: props.manualPlaceholder,
          confirmButton: props.confirmButton,
          excludedUrls: data.value.map((item) => item.url)
        }
      }).onOk((url: string) => {
        const site = getSiteByUrl(url)
        if (site === undefined) {
          notification.value = new NotifyOptions(Error('Valid site not found'))
          return
        }

        data.value.push({ name: SiteName[site], site, url })
      })
    }

    const removeUrl = (url: string) => {
      data.value = data.value.filter((site) => site.url !== url)
    }

    return {
      dialogRef,
      onDialogHide: () => {
        clearSearchResults()
        onDialogHide()
      },
      onOKClick: () => {
        getSources()
        onDialogOK(sources.value)
      },
      onCancelClick: onDialogCancel,
      data,
      showAddDialog,
      removeUrl
    }
  }
})
</script>

<style lang="scss" scoped>

.content {
  white-space: pre-wrap;
}

</style>
