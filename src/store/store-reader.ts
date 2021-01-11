import { InitializeComponents } from 'src/classes/initializeComponents'
import { Manga } from 'src/classes/manga'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { Settings } from 'src/classes/settings'
import { UrlNavigation } from 'src/classes/urlNavigation'
import { mangaSort } from 'src/services/sortService'

class ReaderState {
    mangaList: Manga[] = []
    refreshing = false
    refreshProgress = 0
    notification: NotifyOptions | undefined = undefined
    searchResults: Manga[] = []
    urlNavigation: UrlNavigation | undefined = undefined
    mobileView = false
    settings = new Settings()
    searchValue = ''
    initialized = new InitializeComponents()
}

function doSort (mangaList: Manga[]): Manga[] {
  return mangaList.sort((a, b) => {
    return mangaSort(a, b, state.settings.sortedBy)
  })
}

const state = new ReaderState()

const mutations = {
  updateMangaList (state: ReaderState, mangaList: Manga[]) {
    state.mangaList = doSort(mangaList)
  },
  sortMangaList (state: ReaderState) {
    state.mangaList = doSort(state.mangaList)
  },
  addManga (state: ReaderState, manga: Manga) {
    state.mangaList.unshift(manga)
    state.mangaList = doSort(state.mangaList)
  },
  removeManga (state: ReaderState, url: string) {
    const index = state.mangaList.findIndex(manga => manga.url === url)
    if (index === -1) return
    state.mangaList.splice(index, 1)
    state.mangaList = doSort(state.mangaList)
  },
  updateManga (state: ReaderState, manga: Manga) {
    const index = state.mangaList.findIndex(curManga => manga.url === curManga.url)
    if (index === -1) return
    state.mangaList[index] = manga
    state.mangaList = doSort(state.mangaList)
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
  updateMobileView (state: ReaderState, mobileView: boolean) {
    state.mobileView = mobileView
  },
  updateSettings (state: ReaderState, settings: Settings) {
    state.settings = settings
  },
  updateSearchValue (state: ReaderState, searchValue: string) {
    state.searchValue = searchValue
  },
  updateInitialized (state: ReaderState, initialized: InitializeComponents) {
    state.initialized = initialized
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
  mobileView: (state: ReaderState) => {
    return state.mobileView
  },
  settings: (state: ReaderState) => {
    return state.settings
  },
  searchValue: (state: ReaderState) => {
    return state.searchValue
  },
  initialized: (state: ReaderState) => {
    return state.initialized
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters
}
