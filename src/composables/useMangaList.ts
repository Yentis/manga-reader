import { useStore } from '../store/index'
import { computed, onMounted } from 'vue'
import { Manga } from '../classes/manga'
import { tryMigrateMangaList } from '../services/migrationService'
import { LocalStorage, useQuasar } from 'quasar'
import { Status } from 'src/enums/statusEnum'
import SearchDialog from '../components/SearchDialog.vue'
import SiteDialog from '../components/SiteDialog.vue'
import useNotification from './useNotification'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { getMangaInfoByUrl, getSite, searchManga } from 'src/services/siteService'
import { SiteType } from 'src/enums/siteEnum'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { useSearchResults } from './useSearchResults'
import relevancy from 'relevancy'
import constants from 'src/classes/constants'

export default function useMangaList () {
  const $store = useStore()
  const { notification } = useNotification()

  const mangaList = computed({
    get: () => $store.state.reader.mangaList,
    set: (val) => $store.commit('reader/updateMangaList', val)
  })
  const sortMangaList = () => { $store.commit('reader/sortMangaList') }
  const addManga = (manga: Manga): boolean => {
    const existingManga = mangaList.value.find((curManga) => curManga.url === manga.url)
    if (existingManga !== undefined) {
      notification.value = new NotifyOptions(Error('Manga already exists'))
      return false
    }

    $store.commit('reader/addManga', manga)
    return true
  }
  const removeManga = (url: string) => { $store.commit('reader/removeManga', url) }

  const updateManga = (url: string, manga: Manga) => {
    $store.commit('reader/updateManga', { url, manga })
  }
  const updateMangaAltSources = (url: string, altSources: Record<string, string> | undefined) => {
    $store.commit('reader/updateMangaAltSources', { url, altSources })
  }
  const updateMangaChapter = (url: string, chapter: string) => {
    $store.commit('reader/updateMangaChapter', { url, chapter })
  }
  const updateMangaChapterNum = (url: string, chapterNum: number) => {
    $store.commit('reader/updateMangaChapterNum', { url, chapterNum })
  }
  const updateMangaChapterUrl = (url: string, chapterUrl: string) => {
    $store.commit('reader/updateMangaChapterUrl', { url, chapterUrl })
  }
  const updateMangaChapterDate = (url: string, chapterDate: string) => {
    $store.commit('reader/updateMangaChapterDate', { url, chapterDate })
  }
  const updateMangaImage = (url: string, image: string) => {
    $store.commit('reader/updateMangaImage', { url, image })
  }
  const updateMangaTitle = (url: string, title: string) => {
    $store.commit('reader/updateMangaTitle', { url, title })
  }
  const updateMangaRead = (url: string, read: string | undefined) => {
    $store.commit('reader/updateMangaRead', { url, read })
  }
  const updateMangaReadNum = (url: string, readNum: number | undefined) => {
    $store.commit('reader/updateMangaReadNum', { url, readNum })
  }
  const updateMangaReadUrl = (url: string, readUrl: string | undefined) => {
    $store.commit('reader/updateMangaReadUrl', { url, readUrl })
  }
  const updateMangaLinkedSites = (url: string, linkedSites: Record<string, number>) => {
    $store.commit('reader/updateMangaLinkedSites', { url, linkedSites })
  }
  const updateMangaStatus = (url: string, status: Status) => {
    $store.commit('reader/updateMangaStatus', { url, status })
  }
  const updateMangaNotes = (url: string, notes: string | undefined) => {
    $store.commit('reader/updateMangaNotes', { url, notes })
  }
  const updateMangaRating = (url: string, rating: number | undefined) => {
    $store.commit('reader/updateMangaRating', { url, rating })
  }
  const updateMangaShouldUpdate = (url: string, shouldUpdate: boolean | undefined) => {
    $store.commit('reader/updateMangaShouldUpdate', { url, shouldUpdate })
  }

  const storeManga = () => {
    setTimeout(() => {
      LocalStorage.set(constants.MANGA_LIST_KEY, mangaList.value)
    }, 0)
  }

  const $q = useQuasar()
  const showMangaDialog = (type: string, query = ''): Promise<string | null> => {
    return new Promise((resolve) => {
      $q.dialog({
        component: SearchDialog,
        componentProps: {
          title: `${type} manga`,
          searchPlaceholder: 'Search for a manga',
          manualPlaceholder: 'Or enter a manga url manually',
          confirmButton: type,
          initialSearch: query
        }
      }).onOk((url: string) => {
        resolve(url)
      }).onDismiss(() => {
        if (siteDialog) {
          siteDialog.hide()
        }
        resolve(null)
      })

      const siteDialog = $q.dialog({
        component: SiteDialog
      })
    })
  }

  const showAddMangaDialog = () => showMangaDialog('Add')
  const showUpdateMangaDialog = (query: string) => showMangaDialog('Update', query)

  const fetchManga = async (url: string): Promise<Manga | null> => {
    let manga: Manga | Error
    try {
      manga = await getMangaInfoByUrl(url)
    } catch (error) {
      notification.value = new NotifyOptions(error)
      return null
    }

    if (manga instanceof Error) {
      notification.value = new NotifyOptions(manga)
      return null
    } else {
      manga.read = '0'
      manga.readNum = 0
      return manga
    }
  }

  const searchSite = (siteType: SiteType | LinkingSiteType, query: string, excludedUrls: string[]): boolean => {
    const site = getSite(siteType)
    if (site === undefined) return false
    if (site.loggedIn) return true

    site.openLogin($q, $store).then((loggedIn) => {
      if (loggedIn instanceof Error) {
        notification.value = new NotifyOptions(loggedIn)
        return
      }
      if (!loggedIn) return

      const notifyOptions = new NotifyOptions('Logged in successfully!')
      notifyOptions.type = 'positive'
      notification.value = notifyOptions

      findManga(siteType, query, excludedUrls).catch((error) => {
        notification.value = new NotifyOptions(error)
      })
    }).catch((error) => {
      notification.value = new NotifyOptions(error)
    })

    return false
  }

  const { searchResults } = useSearchResults()
  const findManga = async (siteTypeName: string, query: string, excludedUrls: string[]): Promise<boolean> => {
    const siteType = Object.values(SiteType).find(siteType => siteTypeName === siteType) ||
                     Object.values(LinkingSiteType).find(siteType => siteTypeName === siteType)

    if (siteTypeName !== '') {
      if (siteType === undefined) return false
      const loggedIn = searchSite(siteType, query, excludedUrls)
      if (!loggedIn) return false
    }

    if (!query) return false

    $q.loading.show({
      delay: 100
    })

    let result: Manga[]
    try {
      result = await searchManga(query, siteType)
    } catch (error) {
      notification.value = new NotifyOptions(error)
      $q.loading.hide()
      return false
    }

    // Some websites return results from other websites...
    const processedResults: string[] = []

    const mangaResults = result.filter(resultManga => {
      const alreadyAdded = !mangaList.value.find(manga => resultManga.url === manga.url) &&
                           !processedResults.includes(resultManga.url) &&
                           !excludedUrls.includes(resultManga.url)
      processedResults.push(resultManga.url)

      return alreadyAdded
    })

    if (mangaResults.length === 0) {
      notification.value = new NotifyOptions('No results found')
    }

    searchResults.value = mangaSearchSorter.sort(mangaResults, query, (obj, calc) => {
      return calc(obj.title)
    })
    $q.loading.hide()

    return true
  }

  return {
    mangaList,
    sortMangaList,
    addManga,
    removeManga,
    updateManga,
    updateMangaAltSources,
    updateMangaChapter,
    updateMangaChapterNum,
    updateMangaChapterUrl,
    updateMangaChapterDate,
    updateMangaImage,
    updateMangaTitle,
    updateMangaRead,
    updateMangaReadNum,
    updateMangaReadUrl,
    updateMangaLinkedSites,
    updateMangaStatus,
    updateMangaNotes,
    updateMangaRating,
    updateMangaShouldUpdate,
    storeManga,
    showAddMangaDialog,
    showUpdateMangaDialog,
    fetchManga,
    findManga
  }
}

export function useAppMangaList () {
  const { mangaList } = useMangaList()

  onMounted(async () => {
    try {
      await tryMigrateMangaList()
    } catch (error) {
      console.error(error)
    }

    const localMangaList: Manga[] = LocalStorage.getItem(constants.MANGA_LIST_KEY) || []
    mangaList.value = localMangaList
  })
}

const mangaSearchSorter = new relevancy.Sorter({
  comparator: (a: Manga, b: Manga) => {
    return mangaSort(a, b)
  }
})

function mangaSort (a: Manga, b: Manga): number {
  return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : -1
}
