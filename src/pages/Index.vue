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
import { NotifyOptions } from 'src/classes/notifyOptions'
import { SiteName, SiteType } from 'src/enums/siteEnum'
import * as DropboxService from 'src/services/dropboxService'
import * as GitlabService from 'src/services/gitlabService'
import MangaHeader from 'src/components/Header.vue'
import MangaItem from 'src/components/manga-item/MangaItem.vue'
import useUrlNavigation from 'src/composables/useUrlNavigation'
import useMangaList from 'src/composables/useMangaList'
import useSettings from 'src/composables/useSettings'
import useSearchValue from 'src/composables/useSearchValue'
import useRefreshing from 'src/composables/useRefreshing'
import useRefreshProgress from 'src/composables/useRefreshProgress'
import useInitialized from 'src/composables/useInitialized'
import useNotification from 'src/composables/useNotification'
import { useQuasar } from 'quasar'
import ElectronWindow from 'src/interfaces/electronWindow'

export default defineComponent({
  components: {
    MangaHeader,
    MangaItem
  },

  setup () {
    const $q = useQuasar()
    const { urlNavigation } = useUrlNavigation()
    const { mangaList } = useMangaList()
    const { settings } = useSettings()
    const { searchValue } = useSearchValue()
    const { refreshing } = useRefreshing()
    const { refreshProgress } = useRefreshProgress()
    const { main: mainInitialized, clearInitialized } = useInitialized()
    const { notification } = useNotification()

    const getGitlabNotifyOptions = (error: unknown) => {
      return GitlabService.getNotifyOptions(error, urlNavigation)
    }

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

    if ($q.platform.is.mobile) {
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
      onMounted(() => {
        const electronWindow = window as unknown as ElectronWindow

        electronWindow.mangaReader.onDropboxToken((_event: unknown, token?: string) => {
          const notifyOptions = new NotifyOptions('Logged in successfully! Please import / export again')
          notifyOptions.type = 'positive'
          notification.value = notifyOptions
          DropboxService.setAccessToken(token)
        })

        electronWindow.mangaReader.onGitlabToken((_event: unknown, token?: string) => {
          const notifyOptions = new NotifyOptions('Logged in successfully!')
          notifyOptions.type = 'positive'
          notification.value = notifyOptions
          GitlabService.setAccessToken(token)

          $q.loading.show({
            delay: 100
          })
          GitlabService.createList(JSON.stringify(mangaList.value)).catch(error => {
            notification.value = getGitlabNotifyOptions(error)
          }).finally(() => {
            $q.loading.hide()
          })
        })
      })
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
