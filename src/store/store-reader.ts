import { Manga } from 'src/classes/manga'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { Status } from 'src/enums/statusEnum'

class ReaderState {
    mangaList: Manga[] = []
    refreshing = false
    refreshProgress = 0
    notification: NotifyOptions | undefined = undefined
    searchResults: Manga[] = []
    urlNavigation: UrlNavigation | undefined = undefined
    openInBrowser = false
    darkMode = false
    mobileView = false
}

function mangaSort (a: Manga, b: Manga): number {
  const isARead = a.chapter === a.read || (a.chapterNum === a.readNum && a.readNum !== undefined)
  const isBRead = b.chapter === b.read || (b.chapterNum === b.readNum && b.readNum !== undefined)

  if ((a.status !== Status.READING || undefined) && (b.status === Status.READING || undefined)) {
    return 1
  }
  if ((b.status !== Status.READING || undefined) && (a.status === Status.READING || undefined)) {
    return -1
  }

  if (a.status === Status.DROPPED && b.status !== Status.DROPPED) {
    return 1
  }
  if (b.status === Status.DROPPED && a.status !== Status.DROPPED) {
    return -1
  }

  if (a.status === Status.PLAN_TO_READ && b.status !== Status.PLAN_TO_READ) {
    return 1
  }
  if (b.status === Status.PLAN_TO_READ && a.status !== Status.PLAN_TO_READ) {
    return -1
  }

  if (a.status === Status.ON_HOLD && b.status !== Status.ON_HOLD) {
    return 1
  }
  if (b.status === Status.ON_HOLD && a.status !== Status.ON_HOLD) {
    return -1
  }

  if (!isARead && isBRead) {
    return -1
  }
  if (!isBRead && isARead) {
    return 1
  }

  return a.title > b.title ? 1 : -1
}

const state = new ReaderState()

const mutations = {
  updateMangaList (state: ReaderState, mangaList: Manga[]) {
    state.mangaList = mangaList.sort(mangaSort)
  },
  addManga (state: ReaderState, manga: Manga) {
    state.mangaList.unshift(manga)
    state.mangaList = state.mangaList.sort(mangaSort)
  },
  removeManga (state: ReaderState, url: string) {
    const index = state.mangaList.findIndex(manga => manga.url === url)
    if (index === -1) return
    state.mangaList.splice(index, 1)
    state.mangaList = state.mangaList.sort(mangaSort)
  },
  updateManga (state: ReaderState, manga: Manga) {
    const index = state.mangaList.findIndex(curManga => manga.url === curManga.url)
    if (index === -1) return
    state.mangaList[index] = manga
    state.mangaList = state.mangaList.sort(mangaSort)
  },
  updateRefreshing (state: ReaderState, refreshing: boolean) {
    state.refreshing = refreshing
  },
  updateRefreshProgress (state: ReaderState, refreshProgress: number) {
    state.refreshProgress = refreshProgress
  },
  incrementRefreshProgress (state: ReaderState, increment: number) {
    state.refreshProgress += increment
  },
  pushNotification (state: ReaderState, notification: NotifyOptions) {
    state.notification = notification
  },
  updateSearchResults (state: ReaderState, searchResults: Manga[]) {
    state.searchResults = searchResults
  },
  pushUrlNavigation (state: ReaderState, urlNavigation: UrlNavigation) {
    state.urlNavigation = urlNavigation
  },
  updateOpenInBrowser (state: ReaderState, openInBrowser: boolean) {
    state.openInBrowser = openInBrowser
  },
  updateDarkMode (state: ReaderState, darkMode: boolean) {
    state.darkMode = darkMode
  },
  updateMobileView (state: ReaderState, mobileView: boolean) {
    state.mobileView = mobileView
  }
}

const getters = {
  mangaList: (state: ReaderState) => {
    return state.mangaList
  },
  manga: (state: ReaderState) => (url: string) => {
    return state.mangaList.find(manga => manga.url === url)
  },
  refreshing: (state: ReaderState) => {
    return state.refreshing
  },
  refreshProgress: (state: ReaderState) => {
    return state.refreshProgress
  },
  notification: (state: ReaderState) => {
    return state.notification
  },
  searchResults: (state: ReaderState) => {
    return state.searchResults
  },
  urlNavigation: (state: ReaderState) => {
    return state.urlNavigation
  },
  openInBrowser: (state: ReaderState) => {
    return state.openInBrowser
  },
  darkMode: (state: ReaderState) => {
    return state.darkMode
  },
  mobileView: (state: ReaderState) => {
    return state.mobileView
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters
}
