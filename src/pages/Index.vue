<template>
  <q-page class="q-ma-sm">
    <MangaHeader />

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
        v-for="manga in filteredMangaList"
        :key="manga.url"
        class="q-mb-xs full-width manga-item"
      >
        <MangaItem :url="manga.url" />
      </q-intersection>
    </div>
  </q-page>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted } from 'vue'
import moment from 'moment'
import { SiteName, SiteType } from 'src/enums/siteEnum'
import MangaHeader from 'src/components/Header.vue'
import MangaItem from 'src/components/manga-item/MangaItem.vue'
import useMangaList from 'src/composables/useMangaList'
import useSettings from 'src/composables/useSettings'
import useSearchValue from 'src/composables/useSearchValue'
import useRefreshing from 'src/composables/useRefreshing'
import useRefreshProgress from 'src/composables/useRefreshProgress'
import useInitialized from 'src/composables/useInitialized'
import { useElectronAuth, useStaticAuth } from 'src/composables/useAuthCallback'
import { useQuasar } from 'quasar'

export default defineComponent({
  components: {
    MangaHeader,
    MangaItem
  },

  setup () {
    const $q = useQuasar()
    const { mangaList } = useMangaList()
    const { settings } = useSettings()
    const { searchValue } = useSearchValue()
    const { refreshing } = useRefreshing()
    const { refreshProgress } = useRefreshProgress()
    const { main: mainInitialized, clearInitialized } = useInitialized()

    const filteredMangaList = computed(() => {
      return mangaList.value.filter(manga => {
        if (!settings.value.filters.includes(manga.status)) return false

        const searchWords = searchValue.value.split(' ')
        let title = true
        let notes = true
        let site = true

        return searchWords.every((word) => {
          const lowerCaseWord = word.toLowerCase()

          if (!manga.title.toLowerCase().includes(lowerCaseWord)) {
            title = false
          }

          if (!manga.notes?.toLowerCase().includes(lowerCaseWord)) {
            notes = false
          }

          if (!SiteName[manga.site].toLowerCase().includes(lowerCaseWord)) {
            site = false
          }

          return title || notes || site
        })
      })
    })

    if ($q.platform.is.cordova) {
      onMounted(() => {
        window.cookieMaster.setCookieValue(
          `.${SiteType.Webtoons}`,
          'ageGatePass',
          'true',
          () => undefined,
          (error) => console.error(error)
        )
        window.cookieMaster.setCookieValue(
          `.${SiteType.Webtoons}`,
          'timezoneOffset',
          (moment().utcOffset() / 60).toString(),
          () => undefined,
          (error) => console.error(error)
        )

        document.addEventListener('resume', () => {
          if (!mainInitialized.value) return
          clearInitialized()
        })
      })
    } else if ($q.platform.is.electron) {
      useElectronAuth()
    } else {
      useStaticAuth()
    }

    return {
      mangaList,
      filteredMangaList,
      refreshing,
      refreshProgress
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
