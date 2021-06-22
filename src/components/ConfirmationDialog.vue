<template>
  <q-dialog
    ref="dialog"
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
import Vue, { VueConstructor } from 'vue'
import { QDialog } from 'quasar'

export default (Vue as VueConstructor<Vue &
  { $refs:
    { dialog: QDialog },
  }
>).extend({
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

  methods: {
    show () {
      this.$refs.dialog.show()
    },

    hide () {
      this.$refs.dialog.hide()
    },

    onDialogHide () {
      this.$emit('hide')
    },

    onOKClick () {
      this.$emit('ok')
      this.hide()
    },

    onCancelClick () {
      this.hide()
    }
  }
})
</script>

<style lang="scss" scoped>

.confirmation-image-size {
  max-height: 256px
}

.content {
  white-space: pre-line;
}

</style>
