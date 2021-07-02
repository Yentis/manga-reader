<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>{{ title }}</q-toolbar-title>
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-toolbar>

      <MangaSearch
        v-model:url="url"
        :content="content"
        :search-placeholder="searchPlaceholder"
        :manual-placeholder="manualPlaceholder"
        :initial-search="initialSearch"
        :site-type="siteType"
        :excluded-urls="excludedUrls"
      />

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
import { useDialogPluginComponent } from 'quasar'
import { ref } from 'vue'
import MangaSearch from './SearchComponent.vue'
import { useClearingSearchResults } from 'src/composables/useSearchResults'

export default {
  components: {
    MangaSearch
  },

  props: {
    title: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
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
    siteType: {
      type: String,
      default: undefined
    },
    confirmButton: {
      type: String,
      default: ''
    },
    excludedUrls: {
      type: Array,
      default: () => []
    }
  },

  emits: [...useDialogPluginComponent.emits],

  setup () {
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    const { clearSearchResults } = useClearingSearchResults()
    const url = ref('')

    return {
      dialogRef,
      onDialogHide: () => {
        clearSearchResults()
        onDialogHide()
      },
      onOKClick: () => {
        onDialogOK(url.value)
      },
      onCancelClick: onDialogCancel,
      url
    }
  }
}
</script>
