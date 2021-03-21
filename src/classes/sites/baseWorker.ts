import { SiteType } from 'src/enums/siteEnum'
import { Manga } from '../manga'
import moment from 'moment'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { AxiosRequestConfig } from 'axios'

export abstract class BaseWorker {
  // Use for CORS proxy
  static urlPrefix = ''
  static getUrl (siteType: SiteType | LinkingSiteType) {
    return `${BaseWorker.urlPrefix}https://${siteType}`
  }

  siteType: SiteType | LinkingSiteType
  chapter: cheerio.Cheerio | undefined
  image: cheerio.Cheerio | undefined
  title: cheerio.Cheerio | undefined
  chapterDate: cheerio.Cheerio | undefined
  chapterNum: cheerio.Cheerio | undefined
  requestConfig: AxiosRequestConfig | undefined

  constructor (siteType: SiteType | LinkingSiteType, requestConfig: AxiosRequestConfig | undefined = undefined) {
    this.siteType = siteType
    this.requestConfig = requestConfig
  }

  syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    console.info(`Sync not implemented, ${mangaId}: ${chapterNum}`)
    return Promise.resolve()
  }

  getChapter (): string {
    return this.chapter?.text().trim() || 'Unknown'
  }

  getChapterUrl (): string {
    return this.chapter?.attr('href') || ''
  }

  getChapterNum (): number {
    return this.parseNum(this.chapterNum?.text().trim())
  }

  getImage (): string {
    return this.image?.attr('src') || ''
  }

  getTitle (): string {
    return this.title?.text().trim() || ''
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

  buildManga (url: string): Manga {
    const manga = new Manga(url, this.siteType)
    manga.chapter = this.getChapter()
    manga.chapterUrl = this.getChapterUrl()
    manga.image = this.getImage()
    manga.title = this.getTitle()
    manga.chapterDate = this.getChapterDate()
    manga.chapterNum = this.getChapterNum()

    if (manga.title === '') {
      throw Error('Could not parse site')
    }
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

  protected titleContainsQuery (query: string, title: string | undefined): boolean {
    if (!title) return false

    query = query.replace('’', '\'')
    title = title.replace('’', '\'')
    const querySplit = query.toLowerCase().split(' ')

    return querySplit.every(word => title?.toLowerCase().includes(word))
  }

  abstract readUrl (url: string): Promise<Error | Manga>
  abstract search (query: string): Promise<Error | Manga[]>
}
