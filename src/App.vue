<template>
  <router-view />
</template>

<script lang="ts">

import { defineComponent } from 'vue'
import { useAppUrlNavigation } from './composables/useUrlNavigation'
import { useAppSettings } from './composables/useSettings'
import { useAppNotification } from './composables/useNotification'
import { useAppMangaList } from './composables/useMangaList'
import { useAppWindowSize } from './composables/useWindowSize'
import { useAppPushNotification } from './composables/usePushNotification'
import { useAppAuth } from './composables/useAuthCallback'
import { init as initRequestService } from './services/requestService'

export default defineComponent({
  name: 'App',

  setup () {
    initRequestService()

    useAppNotification()
    useAppAuth()
    useAppSettings()
    useAppMangaList()
    useAppUrlNavigation()
    useAppWindowSize()
    useAppPushNotification()
  }
})
</script>
