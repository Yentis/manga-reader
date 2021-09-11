<template>
  <q-dialog
    ref="dialogRef"
    @hide="onDialogHide"
  >
    <q-card>
      <q-toolbar class="bg-primary text-white">
        <q-toolbar-title>Settings</q-toolbar-title>
        <q-btn
          v-close-popup
          icon="close"
          flat
          round
          dense
        />
      </q-toolbar>

      <q-form @submit="onOKClick">
        <q-card-actions vertical>
          <q-toggle
            v-model="newSettings.openInBrowser"
            :label="isStatic() ? 'Open in new tab' : 'Open in browser'"
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
          v-model="newSettings.refreshOptions.period"
          lazy-rules
          type="number"
          class="q-mx-sm"
          suffix="minutes"
          label="Refresh interval"
          :rules="[
            val => val && val > 0 || 'Must be at least one minute',
            val => val && val <= 1440 || 'Must be at most one day'
          ]"
        />

        <q-card-actions
          v-if="shareId"
          class="q-mx-sm"
          align="center"
        >
          <a
            class="ellipsis"
            :href="`${sitePrefix}${shareId}`"
            @click.prevent="navigate(`${sitePrefix}${shareId}`)"
          >
            {{ `${sitePrefix}${shareId}` }}
          </a>
          <q-btn
            flat
            dense
            icon="content_copy"
            @click="onCopyToClipboard"
          />
        </q-card-actions>

        <q-card-actions
          v-else
          class="q-mx-sm"
          align="center"
        >
          <q-btn
            no-caps
            label="Share List"
            :loading="loading"
            @click="onShareList"
          />
        </q-card-actions>

        <q-card-actions v-if="dev">
          <TestComponent />
        </q-card-actions>

        <q-card-actions>
          <q-space />

          <q-btn
            color="primary"
            label="Confirm"
            type="submit"
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
import { useDialogPluginComponent, copyToClipboard, useQuasar } from 'quasar'
import { defineComponent, onMounted, ref } from 'vue'
import { Settings } from 'src/classes/settings'
import { getShareId } from 'src/services/gitlabService'
import { NotifyOptions } from 'src/classes/notifyOptions'
import useUrlNavigation from 'src/composables/useUrlNavigation'
import useNotification from 'src/composables/useNotification'
import useSettings from 'src/composables/useSettings'
import TestComponent from 'src/components/TestComponent.vue'
import useSharing from 'src/composables/useSharing'
import { getPlatform } from 'src/services/platformService'
import { Platform } from 'src/enums/platformEnum'

export default defineComponent({
  components: { TestComponent },

  emits: [...useDialogPluginComponent.emits],

  setup () {
    const $q = useQuasar()
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    const { navigate } = useUrlNavigation()
    const { notification } = useNotification()
    const { settings } = useSettings()
    const { showShareDialog } = useSharing()

    const loading = ref(false)

    const newSettings = ref(new Settings())
    const getNewSettings = () => {
      newSettings.value = Settings.clone(settings.value)
    }

    onMounted(getNewSettings)

    const shareId = ref('')
    const updateShareId = () => {
      shareId.value = getShareId()
    }

    onMounted(updateShareId)

    const onShareList = async () => {
      loading.value = true
      shareId.value = await showShareDialog()
      loading.value = false
    }

    const sitePrefix = 'https://yentis.github.io/mangalist?id='
    const onCopyToClipboard = () => {
      copyToClipboard(`${sitePrefix}${shareId.value}`)
        .then(() => {
          const notifyOptions = new NotifyOptions('Copied to clipboard!')
          notifyOptions.type = 'positive'
          notification.value = notifyOptions
        })
        .catch(error => {
          notification.value = new NotifyOptions(error, 'Failed to copy to clipboard')
        })
    }

    const isStatic = () => {
      return getPlatform($q) === Platform.Static
    }

    return {
      dialogRef,
      onDialogHide,
      onOKClick: () => {
        settings.value = newSettings.value
        onDialogOK()
      },
      onCancelClick: onDialogCancel,
      sitePrefix,
      dev: process.env.DEV?.toString() === 'true',
      loading,
      newSettings,
      shareId,
      navigate,
      onShareList,
      onCopyToClipboard,
      isStatic
    }
  }
})
</script>
