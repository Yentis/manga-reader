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

  const refreshManga = async (url: string, step?: number) => {
    const manga = $store.state.reader.mangaMap.get(url)
    if (!manga) {
      if (step !== undefined) refreshProgress.value += step
      return
    }

    const result = await getMangaInfo(manga.url, manga.site, manga.altSources)
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

      if (step !== undefined) refreshProgress.value += step
      return
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

    if (step !== undefined) refreshProgress.value += step
    await new Promise<void>((resolve) => {
      const chromeWindow = (window as unknown) as ChromeWindow

      chromeWindow.requestIdleCallback(() => {
        updateManga(manga.url, newManga)
        resolve()
      }, { timeout: 2000 })
    })
  }

  const refreshAllManga = async (): Promise<void> => {
    if (refreshing.value) return
    refreshProgress.value = 0.01
    refreshing.value = true

    const filteredMangaUrlList: string[] = []

    $store.state.reader.mangaMap.forEach((manga, url) => {
      if (manga.status === Status.READING || manga.shouldUpdate === true) return
      filteredMangaUrlList.push(url)
    })

    const step = filteredMangaUrlList.length > 0 ? (1 / filteredMangaUrlList.length) : 0
    const promises = filteredMangaUrlList.map((url) => refreshManga(url, step))

    try {
      await Promise.all(promises)
    } finally {
      storeManga()
      autoRefreshing.value = false
      refreshing.value = false
      refreshProgress.value = 0
    }
  }

  const refreshTimer: Ref<ReturnType<typeof setTimeout> | undefined> = ref()
  const startRefreshTimer = (refreshOptions: RefreshOptions) => {
    if (refreshTimer.value) clearTimeout(refreshTimer.value)
    refreshTimer.value = setTimeout(() => {
      refreshTimer.value = undefined
      if (!refreshOptions.enabled || refreshing.value) {
        startRefreshTimer(refreshOptions)
        return
      }

      autoRefreshing.value = true
      refreshAllManga()
        .finally(() => {
          if (refreshTimer.value) return
          startRefreshTimer(refreshOptions)
        })
        .catch(console.error)
    }, refreshOptions.period * 60 * 1000)
  }

  return {
    refreshing,
    refreshTimer,
    startRefreshTimer,
    refreshManga,
    refreshAllManga
  }
}
