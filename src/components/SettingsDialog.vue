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
            v-if="!isStatic"
            v-model="newSettings.openInBrowser"
            label="Open in browser"
          />
          <q-toggle
            v-if="!isStatic"
            label="Dark mode"
            :model-value="settings.darkMode"
            @update:model-value="toggleDarkMode"
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
import { useDialogPluginComponent, copyToClipboard } from 'quasar'
import { defineComponent, onMounted, ref } from 'vue'
import { Settings } from '../classes/settings'
import { NotifyOptions } from '../classes/notifyOptions'
import useUrlNavigation from '../composables/useUrlNavigation'
import useNotification from '../composables/useNotification'
import useSettings from '../composables/useSettings'
import TestComponent from '../components/TestComponent.vue'
import useSharing from '../composables/useSharing'
import { getPlatform } from '../services/platformService'
import { Platform } from '../enums/platformEnum'
import { getShareId } from '../services/rentryService'

export default defineComponent({
  components: { TestComponent },

  emits: [...useDialogPluginComponent.emits],

  setup () {
    const { dialogRef, onDialogHide, onDialogOK, onDialogCancel } = useDialogPluginComponent()
    const { navigate } = useUrlNavigation()
    const { notification } = useNotification()
    const { settings, toggleDarkMode } = useSettings()
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
      settings,
      newSettings,
      shareId,
      navigate,
      onShareList,
      onCopyToClipboard,
      toggleDarkMode,
      isStatic: getPlatform() === Platform.Static
    }
  }
})
</script>
