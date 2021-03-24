<template>
  <q-dialog
    ref="dialog"
    @hide="onDialogHide"
  >
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>{{ siteName }} Login</q-toolbar-title>
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-toolbar>

      <q-form
        @submit="onOKClick"
      >
        <q-input
          v-model="username"
          filled
          label="Username"
        />

        <q-input
          v-model="password"
          filled
          type="password"
          label="Password"
        />

        <q-card-actions>
          <q-space />

          <q-btn
            label="Submit"
            type="submit"
            color="primary"
          />
          <q-btn
            v-close-popup
            label="Cancel"
          />
        </q-card-actions>
      </q-form>
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
    siteName: {
      required: true,
      type: String
    }
  },

  data () {
    return {
      username: '',
      password: ''
    }
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
      this.$emit('ok', { username: this.username, password: this.password })
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
