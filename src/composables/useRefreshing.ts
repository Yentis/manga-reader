import { useStore } from 'src/store/index'
import { computed, Ref, ref } from 'vue'
import { RefreshOptions } from 'src/classes/refreshOptions'
import useRefreshProgress from './useRefreshProgress'
import useMangaList from './useMangaList'
import { Status } from 'src/enums/statusEnum'
import { getMangaInfo } from 'src/services/siteService'
import useNotification from 'src/composables/useNotification'
import pEachSeries from 'p-each-series'
import { NotifyOptions } from 'src/classes/notifyOptions'
import useUrlNavigation from 'src/composables/useUrlNavigation'
import { UrlNavigation } from 'src/classes/urlNavigation'
import usePushNotification from 'src/composables/usePushNotification'

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

  const refreshAllManga = () => {
    if (refreshing.value) return
    refreshProgress.value = 0.01
    refreshing.value = true

    const filteredMangaList = mangaList.value.filter(manga => manga.status === Status.READING || manga.shouldUpdate)
    const promises = filteredMangaList.map(manga => getMangaInfo(manga.url, manga.site, manga.altSources))
    const step = promises.length > 0 ? (1 / promises.length) : 0
    pEachSeries(promises, (result, index) => {
      const manga = filteredMangaList[index]

      if (result instanceof Error) {
        const notifyOptions = new NotifyOptions(result, `Failed to refresh ${manga.title}`)
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
    }).catch((error: Error) => {
      notification.value = new NotifyOptions(error)
    }).finally(() => {
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

  return {
    refreshing,
    refreshInterval,
    createRefreshInterval,
    refreshAllManga
  }
}
