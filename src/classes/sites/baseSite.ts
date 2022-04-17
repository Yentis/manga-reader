import { Manga } from '../manga'
import { UrlNavigation } from '../urlNavigation'
import { LinkingSiteType } from '../../enums/linkingSiteEnum'
import { SiteState, SiteType } from '../../enums/siteEnum'
import PQueue from 'p-queue'
import { QVueGlobals } from 'quasar/dist/types'
import { Store } from 'vuex'
import * as SiteUtils from 'src/utils/siteUtils'

export class BaseData {
  url: string
  chapter?: Element | null
  chapterNum?: Element | null
  chapterDate?: Element | null
  image?: Element
  title?: Element

  constructor (url: string) {
    this.url = url
  }
}

export abstract class BaseSite {
  abstract siteType: SiteType | LinkingSiteType

  protected requestQueue = new PQueue({ interval: 1000, intervalCap: 10 })
  loggedIn = true
  protected state = SiteState.REACHABLE

  statusOK (): boolean {
    return this.loggedIn && this.state === SiteState.REACHABLE
  }

  hasSearch (): boolean {
    return true
  }

  async checkState (): Promise<void> {
    try {
      const response = await this.readUrl(this.getTestUrl())
      const results = response instanceof Error ? SiteState.OFFLINE : response.title === '' ? SiteState.INVALID : SiteState.REACHABLE

      this.state = results
    } catch (error) {
      console.error(error)
      this.state = SiteState.OFFLINE
    }
  }

  checkLogin (): Promise<boolean> {
    return Promise.resolve(true)
  }

  openLogin ($q: QVueGlobals, store: Store<unknown>): Promise<boolean | Error> {
    store.commit('reader/pushUrlNavigation', new UrlNavigation(this.getLoginUrl(), true))
    return Promise.resolve(false)
  }

  getMangaId ($q: QVueGlobals, store: Store<unknown>, url: string): Promise<number | Error> {
    const parsedUrl = parseInt(url)
    if (!isNaN(parsedUrl)) return Promise.resolve(parsedUrl)

    return Promise.resolve(-1)
  }

  syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    console.info(`Sync not implemented, ${mangaId}: ${chapterNum}`)
    return Promise.resolve()
  }

  protected getChapter (data: BaseData): string {
    return data.chapter?.textContent?.replace(/\n/gm, ' ').trim() || 'Unknown'
  }

  protected getChapterUrl (data: BaseData): string {
    const url = data.chapter?.getAttribute('href') || ''
    if (url.startsWith('/')) return `${this.getUrl()}${url}`

    return url
  }

  protected getChapterNum (data: BaseData): number {
    return SiteUtils.parseNum(data.chapterNum?.textContent?.trim())
  }

  protected getChapterDate (data: BaseData): string {
    return SiteUtils.getDateFromNow(data.chapterDate?.textContent)
  }

  protected getImage (data: BaseData): string {
    const url = data.image?.getAttribute('src') || ''
    if (url.startsWith('/')) return `${this.getUrl()}${url}`

    return url
  }

  protected getTitle (data: BaseData): string {
    return data.title?.textContent?.trim() || ''
  }

  protected static getUrl (siteType: SiteType | LinkingSiteType): string {
    return SiteUtils.getUrl(siteType)
  }

  getUrl (): string {
    return BaseSite.getUrl(this.siteType)
  }

  getLoginUrl (): string {
    return `${this.getUrl()}/login`
  }

  readUrl (url: string): Promise<Error | Manga> {
    return this.addToQueue(() => this.readUrlImpl(url))
  }

  protected abstract readUrlImpl (url: string): Promise<Error | Manga>

  search (query: string): Promise<Error | Manga[]> {
    return this.addToQueue(() => this.searchImpl(query))
  }

  protected abstract searchImpl (query: string): Promise<Error | Manga[]>

  abstract getTestUrl(): string

  compare (b: BaseSite): number {
    if (this.state === SiteState.INVALID && b.state !== SiteState.INVALID) {
      return -1
    } else if (b.state === SiteState.INVALID && this.state !== SiteState.INVALID) {
      return 1
    } else if (!this.loggedIn && b.loggedIn) {
      return -1
    } else if (!b.loggedIn && this.loggedIn) {
      return 1
    } else if (this.state === SiteState.OFFLINE && b.state !== SiteState.OFFLINE) {
      return -1
    } else if (b.state === SiteState.OFFLINE && this.state !== SiteState.OFFLINE) {
      return 1
    } else {
      const siteName = SiteUtils.getSiteNameByUrl(this.siteType)
      const siteNameB = SiteUtils.getSiteNameByUrl(b.siteType)

      if (siteName === undefined && siteNameB === undefined) return 0
      if (siteNameB === undefined) return -1
      if (siteName === undefined) return 1

      return siteName > siteNameB ? 1 : -1
    }
  }

  protected addToQueue<T> (task: (() => PromiseLike<T | Error>)): Promise<T | Error> {
    return this.requestQueue.add(async () => {
      try {
        return await task()
      } catch (error) {
        if (!(error instanceof Error)) {
          return Error(error as string)
        } else {
          return error
        }
      }
    })
  }

  protected buildManga (data: BaseData): Manga {
    const manga = new Manga(data.url, this.siteType)
    manga.chapter = this.getChapter(data)
    manga.chapterUrl = this.getChapterUrl(data)
    manga.chapterNum = this.getChapterNum(data)
    manga.chapterDate = this.getChapterDate(data)
    manga.image = this.getImage(data)
    manga.title = this.getTitle(data)

    if (manga.title === '') {
      throw Error('Could not parse site')
    }
    return manga
  }
}
