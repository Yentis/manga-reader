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

        <q-card-actions v-if="shareId" class="q-mx-sm" align="center">
          <a
            class="ellipsis"
            :href="`${sitePrefix}${shareId}`"
            @click.prevent="onUrlClick(`${sitePrefix}${shareId}`)"
          >
            {{ `${sitePrefix}${shareId}` }}
          </a>
          <q-btn flat dense icon="content_copy"  @click="onCopyToClipboard" />
        </q-card-actions>

        <q-card-actions v-else class="q-mx-sm" align="center">
          <q-btn
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
import { QDialog, copyToClipboard } from 'quasar'
import { Settings } from 'src/classes/settings'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { createList, getAuthUrl, getNotifyOptions, getShareId } from 'src/services/gitlabService'
import ConfirmationDialog from 'src/components/ConfirmationDialog.vue'
import { NotifyOptions } from 'src/classes/notifyOptions'

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
      loading: false,
      sitePrefix: 'https://yentis.github.io/mangalist?id='
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
      this.$q.dialog({
        component: ConfirmationDialog,
        title: 'List sharing',
        content: 'Your list will be uploaded to Gitlab as a Snippet and a shareable URL will be generated.\nThis shareable list will be updated periodically or whenever the app is opened.'
      }).onOk(async () => {
        this.loading = true

        try {
          const shareId = await createList(JSON.stringify(this.mangaList))
          this.shareId = shareId
        } catch (error) {
          const notifyOptions = getNotifyOptions(this, error)

          if (notifyOptions.caption?.includes('Not logged in')) {
            this.pushUrlNavigation(new UrlNavigation(getAuthUrl(), true))
          } else {
            this.pushNotification(notifyOptions)
            console.error(error)
          }
        }

        this.loading = false
      })
    },

    onCopyToClipboard () {
      copyToClipboard(`${this.sitePrefix}${this.shareId}`)
        .then(() => {
          const notifyOptions = new NotifyOptions('Copied to clipboard!')
          notifyOptions.type = 'positive'
          this.pushNotification(notifyOptions)
        })
        .catch(error => {
          this.pushNotification(new NotifyOptions(error, 'Failed to copy to clipboard'))
        })
    }
  }
})
</script>
