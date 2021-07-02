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
import { useAppInitialized } from './composables/useInitialized'

export default defineComponent({
  name: 'App',

  setup () {
    useAppNotification()
    useAppSettings()
    useAppMangaList()
    useAppUrlNavigation()
    useAppWindowSize()
    useAppInitialized()
  }
})
</script>
