<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>{{ title }}</q-toolbar-title>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-toolbar>

      <q-card-section>
        <div class="text-body2">{{ content }}</div>
        <q-img v-if="imageUrl" class="q-mt-sm confirmation-image-size" contain :src="imageUrl"></q-img>
      </q-card-section>

      <q-card-actions>
        <q-space />

        <q-btn color="secondary" label="Confirm" @click="onOKClick"></q-btn>
        <q-btn label="Cancel" v-close-popup></q-btn>
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
    title: String,
    content: String,
    imageUrl: String
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

</style>
