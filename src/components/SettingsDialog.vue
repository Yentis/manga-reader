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
            v-model="newOpenInBrowser"
            label="Open in browser"
          />
          <q-toggle
            v-model="newDarkMode"
            label="Dark mode"
          />
          <q-toggle
            v-model="newRefreshOptions.enabled"
            label="Auto refresh"
          />
        </q-card-actions>
        <q-input
          lazy-rules
          class="q-mx-sm"
          suffix="minutes"
          label="Refresh interval"
          v-model="newRefreshOptions.period"
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
import { LocalStorage, QDialog } from 'quasar'
import { RefreshOptions } from 'src/classes/refreshOptions'

export default (Vue as VueConstructor<Vue &
  { $refs:
    { dialog: QDialog },
  }
>).extend({
  computed: {
    ...mapGetters('reader', {
      openInBrowser: 'openInBrowser',
      darkMode: 'darkMode',
      refreshOptions: 'refreshOptions'
    })
  },

  data () {
    return {
      newOpenInBrowser: false,
      newDarkMode: false,
      newRefreshOptions: new RefreshOptions()
    }
  },

  mounted () {
    this.newOpenInBrowser = this.openInBrowser as boolean
    this.newDarkMode = this.darkMode as boolean

    const refreshOptions = this.refreshOptions as RefreshOptions
    this.newRefreshOptions = new RefreshOptions(refreshOptions.enabled, refreshOptions.period)
  },

  methods: {
    ...mapMutations('reader', {
      updateOpenInBrowser: 'updateOpenInBrowser',
      updateDarkMode: 'updateDarkMode',
      updateRefreshOptions: 'updateRefreshOptions'
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
      if (this.newOpenInBrowser !== this.openInBrowser) {
        this.updateOpenInBrowser(this.newOpenInBrowser)
        LocalStorage.set(this.$constants.OPEN_BROWSER_KEY, this.newOpenInBrowser)
      }
      if (this.newDarkMode !== this.darkMode) {
        this.$q.dark.set(this.newDarkMode)
        this.updateDarkMode(this.newDarkMode)
        LocalStorage.set(this.$constants.DARK_MODE_KEY, this.newDarkMode)
      }
      if (!this.newRefreshOptions.equals(this.refreshOptions)) {
        this.updateRefreshOptions(this.newRefreshOptions)
        LocalStorage.set(this.$constants.REFRESH_OPTIONS, this.newRefreshOptions)
      }

      this.$emit('ok')
      this.hide()
    },

    onCancelClick () {
      this.hide()
    }
  }
})
</script>
