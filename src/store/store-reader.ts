import { Manga } from 'src/classes/manga'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { UpdateManga } from 'src/classes/updateManga'
import { UrlNavigation } from 'src/classes/urlNavigation'

class ReaderState {
    mangaList: Manga[] = []
    refreshing = false
    notification: NotifyOptions | undefined = undefined
    searchResults: Manga[] = []
    urlNavigation: UrlNavigation | undefined = undefined
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
  pushNotification (state: ReaderState, notification: NotifyOptions) {
    state.notification = notification
  },
  updateSearchResults (state: ReaderState, searchResults: Manga[]) {
    state.searchResults = searchResults
  },
  pushUrlNavigation (state: ReaderState, urlNavigation: UrlNavigation) {
    state.urlNavigation = urlNavigation
  }
}

const getters = {
  mangaList: (state: ReaderState) => {
    return state.mangaList
  },
  refreshing: (state: ReaderState) => {
    return state.refreshing
  },
  notification: (state: ReaderState) => {
    return state.notification
  },
  searchResults: (state: ReaderState) => {
    return state.searchResults
  },
  urlNavigation: (state: ReaderState) => {
    return state.urlNavigation
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters
}
