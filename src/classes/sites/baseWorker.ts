import { SiteType } from 'src/enums/siteEnum'
import { Manga } from '../manga'
import moment from 'moment'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { Cheerio, Element, Node } from 'cheerio'
import { BaseWorkerMessage } from '../workerMessage/baseMessage'
import { RequestData, RequestType } from 'src/enums/workerEnum'

export class BaseData {
  url: string
  chapter?: Cheerio<Element | Node>
  chapterNum?: Cheerio<Element | Node>
  chapterDate?: Cheerio<Element>
  image?: Cheerio<Element>
  title?: Cheerio<Element | Node>

  constructor (url: string) {
    this.url = url
  }
}

export abstract class BaseWorker {
  // Use for CORS proxy
  static urlPrefix = ''
  static getUrl (siteType: SiteType | LinkingSiteType) {
    return `${BaseWorker.urlPrefix}https://${siteType}`
  }

  siteType: SiteType | LinkingSiteType

  constructor (siteType: SiteType | LinkingSiteType) {
    this.siteType = siteType
  }

  syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    console.info(`Sync not implemented, ${mangaId}: ${chapterNum}`)
    return Promise.resolve()
  }

  getChapter (data: BaseData): string {
    return data.chapter?.text().trim() || 'Unknown'
  }

  getChapterUrl (data: BaseData): string {
    return data.chapter?.attr('href') || ''
  }

  getChapterNum (data: BaseData): number {
    return this.parseNum(data.chapterNum?.text().trim())
  }

  getChapterDate (data: BaseData): string {
    return this.getDateFromNow(data.chapterDate?.text())
  }

  getImage (data: BaseData): string {
    return data.image?.attr('src') || ''
  }

  getTitle (data: BaseData): string {
    return data.title?.text().trim() || ''
  }

  getDateFromNow (input?: string): string {
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

  buildManga (data: BaseData): Manga {
    const manga = new Manga(data.url, this.siteType)
    manga.chapter = this.getChapter(data)
    manga.chapterUrl = this.getChapterUrl(data)
    manga.image = this.getImage(data)
    manga.title = this.getTitle(data)
    manga.chapterDate = this.getChapterDate(data)
    manga.chapterNum = this.getChapterNum(data)

    if (manga.title === '') {
      throw Error('Could not parse site')
    }
    return manga
  }

  parseNum (elem?: string): number {
    const parsedInt = parseFloat(elem || '0')
    if (isNaN(parsedInt)) {
      return 0
    } else {
      return parsedInt
    }
  }

  protected titleContainsQuery (query: string, title?: string): boolean {
    if (!title) return false

    query = query.replace('’', '\'')
    title = title.replace('’', '\'')
    const querySplit = query.toLowerCase().split(' ')

    return querySplit.every(word => title?.toLowerCase().includes(word))
  }

  protected sendWorkerMessage <T> (requestType: RequestType, input?: unknown): Promise<T> {
    const data = new Map()
    if (input) data.set(RequestData.DATA, input)

    return new Promise((resolve, reject) => {
      const callback: (event: MessageEvent<unknown>) => void = (event) => {
        const message = event.data as BaseWorkerMessage
        if (message.type !== requestType) return

        if (message.data.has(RequestData.ERROR)) {
          reject(message.data.get(RequestData.ERROR))
          removeEventListener('message', callback)
          return
        }

        if (message.data.has(RequestData.DATA)) {
          resolve(message.data.get(RequestData.DATA) as T)
          removeEventListener('message', callback)
          return
        }

        reject(Error('No data found'))
        removeEventListener('message', callback)
      }
      addEventListener('message', callback)

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      postMessage(new BaseWorkerMessage(
        requestType,
        data
      ))
    })
  }

  abstract readUrl (url: string): Promise<Error | Manga>
  abstract search (query: string): Promise<Error | Manga[]>
}
