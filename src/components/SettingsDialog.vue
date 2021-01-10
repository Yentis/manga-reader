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

        <q-card-actions class="q-mx-sm" align="center">
          <a
            v-if="shareId"
            class="ellipsis"
            :href="`https://yentis.github.io/manga-list.html?id=${shareId}`"
            @click.prevent="onUrlClick(`https://yentis.github.io/manga-list.html?id=${shareId}`)"
          >
            {{ `https://yentis.github.io/manga-list.html?id=${shareId}` }}
          </a>
          <q-btn
            v-else
            no-caps
            label="Share List"
            :loading="loading"
            @click="onShareList"
          />
        </q-card-actions>

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
import { NotifyOptions } from 'src/classes/notifyOptions'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { createList, getAuthUrl, getShareId } from 'src/services/gitlabService'

export default (Vue as VueConstructor<Vue &
  { $refs:
    { dialog: QDialog },
  }
>).extend({
  computed: {
    ...mapGetters('reader', {
      settings: 'settings',
      mangaList: 'mangaList'
    })
  },

  data () {
    return {
      newSettings: new Settings(),
      shareId: '',
      loading: false
    }
  },

  mounted () {
    this.newSettings = Settings.clone(this.settings as Settings)
    this.shareId = getShareId()
  },

  methods: {
    ...mapMutations('reader', {
      updateSettings: 'updateSettings',
      pushNotification: 'pushNotification',
      pushUrlNavigation: 'pushUrlNavigation'
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
    },

    onUrlClick (url: string) {
      this.pushUrlNavigation(new UrlNavigation(url, false))
    },

    onShareList () {
      this.loading = true

      createList(JSON.stringify(this.mangaList))
        .then(id => {
          this.shareId = id
        })
        .catch(error => {
          if (error instanceof Error) {
            if (error.message === 'Not logged in') {
              this.pushUrlNavigation(new UrlNavigation(getAuthUrl(), true))
              return
            }
          }
          const message = error instanceof Error ? error.message : error as string
          const notifyOptions = new NotifyOptions(message, 'Failed to create share URL')
          notifyOptions.actions = [{
            label: 'Relog',
            handler: () => {
              this.pushUrlNavigation(new UrlNavigation(getAuthUrl(), true))
            },
            color: 'white'
          }]
          this.pushNotification(notifyOptions)
          console.error(error)
        })
        .finally(() => {
          this.loading = false
        })
    }
  }
})
</script>
