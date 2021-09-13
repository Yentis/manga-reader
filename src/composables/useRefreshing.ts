import { useStore } from 'src/store/index'
import { computed, ref } from 'vue'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import { RefreshOptions } from 'src/classes/refreshOptions'
import useRefreshProgress from './useRefreshProgress'
import useMangaList from './useMangaList'
import { Status } from 'src/enums/statusEnum'
import { getMangaInfo } from 'src/services/siteService'
import useNotification from 'src/composables/useNotification'
import { NotifyOptions } from 'src/classes/notifyOptions'
import useUrlNavigation from 'src/composables/useUrlNavigation'
import { UrlNavigation } from 'src/classes/urlNavigation'
import usePushNotification from 'src/composables/usePushNotification'
import { SiteName } from 'src/enums/siteEnum'

export default function useRefreshing () {
  const autoRefreshing = ref(false)
  const { refreshProgress, incrementRefreshProgress } = useRefreshProgress()
  const {
    mangaList,
    storeManga,
    sortMangaList,
    updateMangaChapter,
    updateMangaChapterNum,
    updateMangaChapterUrl,
    updateMangaChapterDate,
    updateMangaImage,
    updateMangaTitle
  } = useMangaList()
  const { notification } = useNotification()
  const { urlNavigation } = useUrlNavigation()
  const { sendPushNotification } = usePushNotification()

  const $store = useStore()
  const refreshing = computed({
    get: () => $store.state.reader.refreshing,
    set: (val) => $store.commit('reader/updateRefreshing', val)
  })

  const refreshAllManga = (forceRefresh = false) => {
    if (refreshing.value) return
    refreshProgress.value = 0.01
    refreshing.value = true

    const filteredMangaList = mangaList.value.filter(manga => {
      // Force refresh will check all manga that don't get updated with a regular refresh
      if (!forceRefresh) return manga.status === Status.READING || manga.shouldUpdate
      else return manga.status !== Status.READING && !manga.shouldUpdate
    })
    const promises = filteredMangaList.map(manga => {
      const promise = getMangaInfo(manga.url, manga.site, manga.altSources).then((result) => {
        if (result instanceof Error) {
          const notifyOptions = new NotifyOptions(`${SiteName[manga.site]} | ${result.message}`, `Failed to refresh ${manga.title}`)
          notifyOptions.actions = [{
            label: 'Visit',
            handler: () => {
              urlNavigation.value = new UrlNavigation(manga.url, true)
            },
            color: 'white'
          }]

          notification.value = notifyOptions
        } else {
          if (autoRefreshing.value && manga.chapter !== result.chapter) {
            sendPushNotification(result)
          }

          updateMangaTitle(manga.url, result.title)
          updateMangaChapter(manga.url, result.chapter)
          updateMangaChapterUrl(manga.url, result.chapterUrl)
          updateMangaChapterNum(manga.url, result.chapterNum)
          updateMangaChapterDate(manga.url, result.chapterDate)
          updateMangaImage(manga.url, result.image)

          sortMangaList()
        }

        incrementRefreshProgress(step)
      })

      return promise
    })
    const step = promises.length > 0 ? (1 / promises.length) : 0

    Promise.all(promises)
      .catch((error) => console.error(error))
      .finally(() => {
        storeManga()
        autoRefreshing.value = false
        refreshing.value = false
        refreshProgress.value = 0
      })
  }

  const refreshInterval: Ref<ReturnType<typeof setInterval> | undefined> = ref()
  const createRefreshInterval = (refreshOptions: RefreshOptions) => {
    refreshInterval.value = setInterval(() => {
      if (!refreshOptions.enabled || refreshing.value) return
      autoRefreshing.value = true
      refreshAllManga()
    }, refreshOptions.period * 60 * 1000)
  }

  const offerRefresh = () => {
    const notifyOptions = new NotifyOptions('Would you like to do a full refresh?', 'Broken image detected')
    notifyOptions.type = 'warning'
    notifyOptions.actions = [{
      label: 'Refresh',
      handler: () => refreshAllManga(true),
      color: 'black'
    }]

    notification.value = notifyOptions
  }

  return {
    refreshing,
    refreshInterval,
    createRefreshInterval,
    refreshAllManga,
    offerRefresh
  }
}
