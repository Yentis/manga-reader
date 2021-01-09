<template>
  <q-dialog ref="dialog" @hide="onDialogHide">
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Settings</q-toolbar-title>
        <q-btn icon="close" flat round dense v-close-popup />
      </q-toolbar>

      <q-form @submit="onOKClick">
        <q-card-actions vertical>
          <q-toggle
            v-model="newSettings.openInBrowser"
            label="Open in browser"
          />
          <q-toggle
            v-model="newSettings.darkMode"
            label="Dark mode"
          />
          <q-toggle
            v-model="newSettings.refreshOptions.enabled"
            label="Auto refresh"
          />
        </q-card-actions>
        <q-input
          lazy-rules
          type="number"
          class="q-mx-sm"
          suffix="minutes"
          label="Refresh interval"
          v-model="newSettings.refreshOptions.period"
          :rules="[
            val => val && val > 0 || 'Must be at least one minute',
            val => val && val <= 1440 || 'Must be at most one day'
          ]"
        />

        <q-card-actions>
          <q-space />

          <q-btn color="secondary" label="Confirm" type="submit"></q-btn>
          <q-btn label="Cancel" v-close-popup></q-btn>
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import Vue, { VueConstructor } from 'vue'
import { mapGetters, mapMutations } from 'vuex'
import { QDialog } from 'quasar'
import { Settings } from 'src/classes/settings'

export default (Vue as VueConstructor<Vue &
  { $refs:
    { dialog: QDialog },
  }
>).extend({
  computed: {
    ...mapGetters('reader', {
      settings: 'settings'
    })
  },

  data () {
    return {
      newSettings: new Settings()
    }
  },

  mounted () {
    this.newSettings = Settings.clone(this.settings as Settings)
  },

  methods: {
    ...mapMutations('reader', {
      updateSettings: 'updateSettings'
    }),

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
      this.updateSettings(this.newSettings)
      this.$emit('ok')
      this.hide()
    },

    onCancelClick () {
      this.hide()
    }
  }
})
</script>
