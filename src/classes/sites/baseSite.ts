import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import moment from 'moment'
import PQueue from 'p-queue'
import axios from 'axios'

export abstract class BaseSite {
    abstract siteType: SiteType

    requestQueue = new PQueue({ interval: 1000, intervalCap: 10 })
    chapter: Cheerio | undefined
    image: Cheerio | undefined
    title: Cheerio | undefined
    chapterDate: Cheerio | undefined
    chapterNum: Cheerio | undefined
    loggedIn = true
    reachable = true

    isReachable (): boolean {
      return this.reachable
    }

    statusOK (): boolean {
      return this.loggedIn && this.reachable
    }

    checkReachable (): void {
      this.addToQueue(async () => {
        const response = await axios.get(this.getUrl())
        return response.status < 400
      }).then((results) => {
        this.reachable = results === true
      }).catch((error) => {
        console.error(error)
        this.reachable = false
      })
    }

    checkLogin (): void {
      // Do nothing
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

    abstract readUrl(url: string): Promise<Error | Manga>
    abstract search(query: string): Promise<Error | Manga[]>
}
