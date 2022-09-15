import { Status } from 'src/enums/statusEnum'
import { Manga } from '../classes/manga'
import { NotifyOptions } from '../classes/notifyOptions'
import { Settings } from '../classes/settings'
import { UrlNavigation } from '../classes/urlNavigation'

export class ReaderState {
  mangaMap: Map<string, Manga> = new Map()
  refreshing = false
  notification: NotifyOptions | undefined = undefined
  searchResults: Manga[] = []
  urlNavigation: UrlNavigation | undefined = undefined
  mobileView = false
  settings = new Settings()
  searchValue = ''
  errors: NotifyOptions[] = []
}

const state = new ReaderState()

const mutations = {
  updateMangaList (state: ReaderState, mangaList: Manga[]) {
    const map = new Map<string, Manga>()

    mangaList.forEach((manga) => map.set(manga.url, manga))
    state.mangaMap = map
  },
  addManga (state: ReaderState, manga: Manga) {
    state.mangaMap.set(manga.url, manga)
  },
  removeManga (state: ReaderState, url: string) {
    state.mangaMap.delete(url)
  },
  updateManga (state: ReaderState, data: { url: string, manga: Manga }) {
    if (data.url !== data.manga.url) {
      state.mangaMap.delete(data.url)
    }
    state.mangaMap.set(data.manga.url, data.manga)
  },
  updateMangaAltSources (state: ReaderState, data: { url: string, altSources: Record<string, string> | undefined }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.altSources = data.altSources
  },
  updateMangaChapterNum (state: ReaderState, data: { url: string, chapterNum: number }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.chapterNum = data.chapterNum
  },
  updateMangaChapterUrl (state: ReaderState, data: { url: string, chapterUrl: string }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.chapterUrl = data.chapterUrl
  },
  updateMangaChapterDate (state: ReaderState, data: { url: string, chapterDate: string }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.chapterDate = data.chapterDate
  },
  updateMangaImage (state: ReaderState, data: { url: string, image: string }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.image = data.image
  },
  updateMangaTitle (state: ReaderState, data: { url: string, title: string }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.title = data.title
  },
  updateMangaRead (state: ReaderState, data: { url: string, read: string | undefined }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.read = data.read
  },
  updateMangaReadNum (state: ReaderState, data: { url: string, readNum: number | undefined }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.readNum = data.readNum
  },
  updateMangaReadUrl (state: ReaderState, data: { url: string, readUrl: string | undefined }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.readUrl = data.readUrl
  },
  updateMangaLinkedSites (state: ReaderState, data: { url: string, linkedSites: Record<string, number> }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.linkedSites = data.linkedSites
  },
  updateMangaStatus (state: ReaderState, data: { url: string, status: Status }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.status = data.status
  },
  updateMangaNotes (state: ReaderState, data: { url: string, notes: string | undefined }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.notes = data.notes
  },
  updateMangaRating (state: ReaderState, data: { url: string, rating: number | undefined }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.rating = data.rating
  },
  updateMangaShouldUpdate (state: ReaderState, data: { url: string, shouldUpdate: boolean | undefined }) {
    const manga = state.mangaMap.get(data.url)
    if (manga === undefined) return
    manga.shouldUpdate = data.shouldUpdate
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
  addError (state: ReaderState, error: NotifyOptions) {
    state.errors.push(error)
  },
  updateErrors (state: ReaderState, errors: NotifyOptions[]) {
    state.errors = errors
  }
}

const getters = {
  mangaMap: (state: ReaderState) => {
    return state.mangaMap
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
  errors: (state: ReaderState) => {
    return state.errors
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters
}
