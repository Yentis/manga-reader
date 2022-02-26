<template>
  <q-dialog
    ref="dialogRef"
    :full-width="true"
    @hide="onDialogHide"
  >
    <MangaItem
      :url="url"
      :initial-editing="true"
      @manga-saved="onOKClick"
      @manga-removed="onCancelClick"
    />
  </q-dialog>
</template>

<script lang="ts">
import { useDialogPluginComponent } from 'quasar'
import MangaItem from '../components/manga-item/MangaItem.vue'

export default {
  components: {
    MangaItem
  },

  props: {
    url: {
      type: String,
      required: true
    }
  },

  emits: [...useDialogPluginComponent.emits],

  setup () {
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()

    return {
      dialogRef,
      onDialogHide,
      onOKClick: onDialogOK,
      onCancelClick: onDialogCancel
    }
  }
}
</script>
