import { Status } from 'src/enums/statusEnum'
import { Manga } from '../classes/manga'
import { NotifyOptions } from '../classes/notifyOptions'
import { Settings } from '../classes/settings'
import { UrlNavigation } from '../classes/urlNavigation'
import { mangaSort } from '../services/sortService'

export class ReaderState {
  mangaList: Manga[] = []
  refreshing = false
  refreshProgress = 0
  notification: NotifyOptions | undefined = undefined
  searchResults: Manga[] = []
  urlNavigation: UrlNavigation | undefined = undefined
  mobileView = false
  settings = new Settings()
  searchValue = ''
}

function doSort (state: ReaderState, mangaList: Manga[] = state.mangaList): Manga[] {
  return mangaList.sort((a, b) => {
    return mangaSort(a, b, state.settings.sortedBy)
  })
}

function getMangaByUrl (state: ReaderState, url: string): Manga | undefined {
  return state.mangaList.find((manga) => url === manga.url)
}

const state = new ReaderState()

const mutations = {
  updateMangaList (state: ReaderState, mangaList: Manga[]) {
    state.mangaList = doSort(state, mangaList)
  },
  sortMangaList (state: ReaderState) {
    state.mangaList = doSort(state)
  },
  addManga (state: ReaderState, manga: Manga) {
    state.mangaList.unshift(manga)
    state.mangaList = doSort(state)
  },
  removeManga (state: ReaderState, url: string) {
    state.mangaList = state.mangaList.filter((manga) => manga.url !== url)
    state.mangaList = doSort(state)
  },
  updateManga (state: ReaderState, data: { url: string, manga: Manga }) {
    const index = state.mangaList.findIndex(curManga => data.url === curManga.url)
    if (index === -1) return
    state.mangaList[index] = data.manga
    state.mangaList = doSort(state)
  },
  updateMangaAltSources (state: ReaderState, data: { url: string, altSources: Record<string, string> | undefined }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.altSources = data.altSources
  },
  updateMangaChapter (state: ReaderState, data: { url: string, chapter: string }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.chapter = data.chapter
    state.mangaList = doSort(state)
  },
  updateMangaChapterNum (state: ReaderState, data: { url: string, chapterNum: number }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.chapterNum = data.chapterNum
  },
  updateMangaChapterUrl (state: ReaderState, data: { url: string, chapterUrl: string }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.chapterUrl = data.chapterUrl
  },
  updateMangaChapterDate (state: ReaderState, data: { url: string, chapterDate: string }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.chapterDate = data.chapterDate
  },
  updateMangaImage (state: ReaderState, data: { url: string, image: string }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.image = data.image
  },
  updateMangaTitle (state: ReaderState, data: { url: string, title: string }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.title = data.title
  },
  updateMangaRead (state: ReaderState, data: { url: string, read: string | undefined }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.read = data.read
    state.mangaList = doSort(state)
  },
  updateMangaReadNum (state: ReaderState, data: { url: string, readNum: number | undefined }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.readNum = data.readNum
  },
  updateMangaReadUrl (state: ReaderState, data: { url: string, readUrl: string | undefined }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.readUrl = data.readUrl
  },
  updateMangaLinkedSites (state: ReaderState, data: { url: string, linkedSites: Record<string, number> }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.linkedSites = data.linkedSites
  },
  updateMangaStatus (state: ReaderState, data: { url: string, status: Status }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.status = data.status
    state.mangaList = doSort(state)
  },
  updateMangaNotes (state: ReaderState, data: { url: string, notes: string | undefined }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.notes = data.notes
  },
  updateMangaRating (state: ReaderState, data: { url: string, rating: number | undefined }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.rating = data.rating
  },
  updateMangaShouldUpdate (state: ReaderState, data: { url: string, shouldUpdate: boolean | undefined }) {
    const manga = getMangaByUrl(state, data.url)
    if (manga === undefined) return
    manga.shouldUpdate = data.shouldUpdate
  },
  updateRefreshing (state: ReaderState, refreshing: boolean) {
    state.refreshing = refreshing
  },
  updateRefreshProgress (state: ReaderState, refreshProgress: number) {
    state.refreshProgress = refreshProgress
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
  mobileView: (state: ReaderState) => {
    return state.mobileView
  },
  settings: (state: ReaderState) => {
    return state.settings
  },
  searchValue: (state: ReaderState) => {
    return state.searchValue
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters
}
