<template>
  <q-page class="q-ma-sm">
    <MangaHeader
      v-model:refresh-progress="refreshProgress"
    />

    <q-linear-progress
      v-if="refreshing"
      :indeterminate="refreshProgress === 0"
      :value="refreshProgress"
      instant-feedback
      size="xl"
      class="q-mt-sm"
    />

    <div class="manga-container q-mt-sm full-width">
      <q-intersection
        v-for="url in mangaUrls"
        :key="url"
        class="q-mb-xs full-width manga-item"
      >
        <MangaItem
          :url="url"
          @image-load-failed="offerRefresh"
        />
      </q-intersection>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue'
import MangaHeader from '../components/Header.vue'
import MangaItem from '../components/manga-item/MangaItem.vue'
import useSettings from '../composables/useSettings'
import useSearchValue from '../composables/useSearchValue'
import useRefreshing from '../composables/useRefreshing'
import { getSiteNameByUrl } from '../utils/siteUtils'
import { useAppInitialized, useCordovaInitialized, useElectronInitialized, useStaticInitialized } from '../composables/useInitialized'
import { getPlatform } from '../services/platformService'
import { Platform } from '../enums/platformEnum'
import { useStore } from '../store'
import { Manga } from '../classes/manga'
import { mangaSort } from '../services/sortService'

export default defineComponent({
  components: {
    MangaHeader,
    MangaItem
  },

  setup () {
    useAppInitialized()

    const $store = useStore()
    const { settings } = useSettings()
    const { searchValue } = useSearchValue()
    const refreshProgress = ref(0)
    const { refreshing, offerRefresh } = useRefreshing(refreshProgress)

    const mangaMap = computed(() => $store.state.reader.mangaMap)
    const mangaUrls = computed(() => {
      const matchedManga: Manga[] = []

      mangaMap.value.forEach((manga) => {
        if (!settings.value.filters.includes(manga.status)) return

        const searchWords = searchValue.value.split(' ')
        let title = true
        let notes = true
        let site = true

        const containsWords = searchWords.every((word) => {
          const lowerCaseWord = word.toLowerCase()

          if (!manga.title.toLowerCase().includes(lowerCaseWord)) {
            title = false
          }

          if (!manga.notes?.toLowerCase().includes(lowerCaseWord)) {
            notes = false
          }

          const siteName = getSiteNameByUrl(manga.site)
          if (!siteName?.toLowerCase().includes(lowerCaseWord)) {
            site = false
          }

          return title || notes || site
        })
        if (!containsWords) return

        matchedManga.push(manga)
      })

      return matchedManga.sort((a, b) => {
        return mangaSort(a, b, $store.state.reader.settings.sortedBy)
      }).map((manga) => manga.url)
    })

    switch (getPlatform()) {
      case Platform.Cordova:
        useCordovaInitialized()
        break
      case Platform.Electron:
        useElectronInitialized()
        break
      case Platform.Static:
        useStaticInitialized()
        break
    }

    return {
      mangaUrls,
      refreshing,
      refreshProgress,
      offerRefresh
    }
  }
})
</script>

<style lang="scss">

.flex-column-between {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

a {
  text-decoration: none;
  color: $primary;
}

.manga-container {
  display: inline-block;
}

.manga-item {
  min-height: 11rem;
}

</style>
