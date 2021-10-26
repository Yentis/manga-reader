import { useStore } from 'src/store/index'
import { computed, ref } from 'vue'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import { RefreshOptions } from 'src/classes/refreshOptions'
import useMangaList from './useMangaList'
import { Status } from 'src/enums/statusEnum'
import { getMangaInfo } from 'src/services/siteService'
import useNotification from 'src/composables/useNotification'
import { NotifyOptions } from 'src/classes/notifyOptions'
import useUrlNavigation from 'src/composables/useUrlNavigation'
import { UrlNavigation } from 'src/classes/urlNavigation'
import usePushNotification from 'src/composables/usePushNotification'
import { getSiteNameByUrl } from 'src/utils/siteUtils'
import { Manga } from 'src/classes/manga'
import ChromeWindow from 'src/interfaces/chromeWindow'

export default function useRefreshing (refreshProgress: Ref<number>) {
  const autoRefreshing = ref(false)
  const {
    storeManga,
    updateManga
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

    const filteredMangaList: Manga[] = []

    $store.state.reader.mangaMap.forEach((manga) => {
      // Force refresh will check all manga that don't get updated with a regular refresh
      if (!forceRefresh) {
        if (manga.status !== Status.READING && !manga.shouldUpdate) return
        filteredMangaList.push(manga)
        return
      }

      if (manga.status === Status.READING || manga.shouldUpdate) return
      filteredMangaList.push(manga)
    })

    const promises = filteredMangaList.map((manga) => {
      const promise = getMangaInfo(manga.url, manga.site, manga.altSources).then((result) => {
        if (result instanceof Error) {
          const notifyOptions = new NotifyOptions(`${getSiteNameByUrl(manga.site) || 'Unknown site'} | ${result.message}`, `Failed to refresh ${manga.title}`)
          notifyOptions.actions = [{
            label: 'Visit',
            handler: () => {
              urlNavigation.value = new UrlNavigation(manga.url, true)
            },
            color: 'white'
          }]

          notification.value = notifyOptions

          refreshProgress.value += step
          return Promise.resolve()
        }

        if (autoRefreshing.value && manga.chapter !== result.chapter) {
          sendPushNotification(result)
        }

        const newManga = Object.assign({}, manga, {
          title: result.title,
          chapter: result.chapter,
          chapterUrl: result.chapterUrl,
          chapterNum: result.chapterNum,
          chapterDate: result.chapterDate,
          image: result.image
        })
        refreshProgress.value += step

        return new Promise<void>((resolve) => {
          const chromeWindow = (window as unknown) as ChromeWindow

          chromeWindow.requestIdleCallback(() => {
            updateManga(manga.url, newManga)
            resolve()
          }, { timeout: 2000 })
        })
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
