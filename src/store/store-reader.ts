import { Manga } from 'src/classes/manga'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { UpdateManga } from 'src/classes/updateManga'
import { UrlNavigation } from 'src/classes/urlNavigation'

class ReaderState {
    mangaList: Manga[] = []
    refreshing = false
    refreshProgress = 0
    notification: NotifyOptions | undefined = undefined
    searchResults: Manga[] = []
    urlNavigation: UrlNavigation | undefined = undefined
    openInBrowser = false
}

const state = new ReaderState()

const mutations = {
  updateMangaList (state: ReaderState, mangaList: Manga[]) {
    state.mangaList = mangaList
  },
  addManga (state: ReaderState, manga: Manga) {
    state.mangaList.unshift(manga)
  },
  removeManga (state: ReaderState, index: number) {
    state.mangaList.splice(index, 1)
  },
  updateManga (state: ReaderState, updateManga: UpdateManga) {
    state.mangaList[updateManga.index] = updateManga.manga
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
  }
}

const getters = {
  mangaList: (state: ReaderState) => {
    return state.mangaList
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
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters
}
