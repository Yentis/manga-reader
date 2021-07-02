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

      <q-card-section>
        <div class="text-body2 content">
          {{ content }}
        </div>
        <q-img
          v-if="imageUrl"
          class="q-mt-sm confirmation-image-size"
          fit="scale-down"
          contain
          :src="imageUrl"
        />
      </q-card-section>

      <q-card-actions>
        <q-space />

        <q-btn
          color="primary"
          label="Confirm"
          @click="onOKClick"
        />
        <q-btn
          v-if="!hideCancel"
          v-close-popup
          label="Cancel"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { useDialogPluginComponent } from 'quasar'

export default {
  props: {
    title: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    imageUrl: {
      type: String,
      default: ''
    },
    hideCancel: Boolean
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

<style lang="scss" scoped>

.confirmation-image-size {
  max-height: 16em;
}

.content {
  white-space: pre-line;
}

</style>
