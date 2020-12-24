import { Manga } from '../manga'
import { UrlNavigation } from '../urlNavigation'
import { SiteName, SiteState, SiteType } from '../../enums/siteEnum'
import { LinkingSiteType } from '../../enums/linkingSiteEnum'
import { ComponentRenderProxy } from '@vue/composition-api'
import moment from 'moment'
import PQueue from 'p-queue'
import { AxiosRequestConfig } from 'axios'

export abstract class BaseSite {
    abstract siteType: SiteType | LinkingSiteType

    requestQueue = new PQueue({ interval: 1000, intervalCap: 10 })
    chapter: Cheerio | undefined
    image: Cheerio | undefined
    title: Cheerio | undefined
    chapterDate: Cheerio | undefined
    chapterNum: Cheerio | undefined
    loggedIn = true
    state = SiteState.REACHABLE
    requestConfig: AxiosRequestConfig | undefined

    statusOK (): boolean {
      return this.loggedIn && this.state === SiteState.REACHABLE
    }

    checkState (): Promise<void> {
      return new Promise(resolve => {
        this.addToQueue(async () => {
          const response = await this.readUrl(this.getTestUrl())
          return response instanceof Error ? SiteState.OFFLINE : response.title === 'Unknown' ? SiteState.INVALID : SiteState.REACHABLE
        }).then((results) => {
          if (results instanceof Error) {
            this.state = SiteState.OFFLINE
          } else {
            this.state = results
          }
        }).catch((error) => {
          console.error(error)
          this.state = SiteState.OFFLINE
        }).finally(() => {
          resolve()
        })
      })
    }

    checkLogin (): Promise<boolean> {
      return Promise.resolve(true)
    }

    openLogin (componentRenderProxy: ComponentRenderProxy): Promise<boolean | Error> {
      componentRenderProxy.$store.commit('reader/pushUrlNavigation', new UrlNavigation(this.getLoginUrl(), true))
      return Promise.resolve(false)
    }

    getMangaId (_componentRenderProxy: ComponentRenderProxy, url: string): Promise<number | Error> {
      const parsedUrl = parseInt(url)
      if (!isNaN(parsedUrl)) return Promise.resolve(parsedUrl)

      return Promise.resolve(-1)
    }

    syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
      console.log(`Sync not implemented, ${mangaId}: ${chapterNum}`)
      return Promise.resolve()
    }

    getUrl (): string {
      return `https://${this.siteType}`
    }

    getLoginUrl (): string {
      return `${this.getUrl()}/login`
    }

    getChapter (): string {
      return this.chapter?.text().trim() || 'Unknown'
    }

    getChapterNum (): number {
      return this.parseNum(this.chapterNum?.text().trim())
    }

    getChapterUrl (): string {
      return this.chapter?.attr('href') || ''
    }

    getChapterDate (): string {
      return this.getDateFromNow(this.chapterDate?.text())
    }

    getDateFromNow (input: string | undefined): string {
      const date = moment()
      const chapterDate = input?.trim().split(' ') || []
      let amount = -1

      if (chapterDate[0]) {
        amount = parseInt(chapterDate[0]) || -1
      }

      if (amount !== -1 && chapterDate[1]) {
        const durationUnit = chapterDate[1]
        if (durationUnit.startsWith('sec')) {
          date.subtract(amount, 'second')
        } else if (durationUnit.startsWith('min')) {
          date.subtract(amount, 'minute')
        } else if (durationUnit.startsWith('hour')) {
          date.subtract(amount, 'hour')
        } else if (durationUnit.startsWith('day')) {
          date.subtract(amount, 'day')
        } else if (durationUnit.startsWith('week')) {
          date.subtract(amount, 'week')
        } else if (durationUnit.startsWith('month')) {
          date.subtract(amount, 'month')
        } else if (durationUnit.startsWith('year')) {
          date.subtract(amount, 'year')
        }

        return date.fromNow()
      }

      return ''
    }

    getImage (): string {
      return this.image?.attr('src') || ''
    }

    getTitle (): string {
      return this.title?.text().trim() || 'Unknown'
    }

    buildManga (url: string): Manga {
      const manga = new Manga(url, this.siteType)
      manga.chapter = this.getChapter()
      manga.chapterUrl = this.getChapterUrl()
      manga.image = this.getImage()
      manga.title = this.getTitle()
      manga.chapterDate = this.getChapterDate()
      manga.chapterNum = this.getChapterNum()

      return manga
    }

    parseNum (elem: string | undefined): number {
      const parsedInt = parseFloat(elem || '0')
      if (isNaN(parsedInt)) {
        return 0
      } else {
        return parsedInt
      }
    }

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
        return SiteName[this.siteType] > SiteName[b.siteType] ? 1 : -1
      }
    }

    protected addToQueue<T> (task: (() => PromiseLike<T | Error>)): Promise<T | Error> {
      return this.requestQueue.add(async () => {
        try {
          return await task()
        } catch (error) {
          if (!(error instanceof Error)) {
            return Error(error)
          } else {
            return error
          }
        }
      })
    }

    protected titleContainsQuery (query: string, title: string | undefined): boolean {
      if (!title) return false

      const querySplit = query.toLowerCase().split(' ')
      return querySplit.every(word => title.toLowerCase().includes(word))
    }

    abstract getTestUrl(): string
    abstract readUrl(url: string): Promise<Error | Manga>
    abstract search(query: string): Promise<Error | Manga[]>
}
