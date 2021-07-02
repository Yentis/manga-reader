import { BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios, { AxiosRequestConfig } from 'axios'
import { Manga } from '../../manga'
import cheerio from 'cheerio'
import { SiteType } from '../../../enums/siteEnum'

export class ArangScansWorker extends BaseWorker {
  static siteType = SiteType.ArangScans
  static url = BaseWorker.getUrl(ArangScansWorker.siteType)

  static testUrl = `${ArangScansWorker.url}/titles/08d93994-4f13-422a-8693-4e1b1f154a77`

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(ArangScansWorker.siteType, requestConfig)
  }

  getChapterUrl (): string {
    const chapterUrl = this.chapter?.attr('href')
    if (chapterUrl === undefined) return ''

    return `${ArangScansWorker.url}${chapterUrl}`
  }

  getChapterNum (): number {
    const chapterNum = this.chapterNum?.text().trim().replace('Chapter ', '')
    return this.parseNum(chapterNum)
  }

  getChapterDate (): string {
    const chapterDate = moment(this.chapterDate?.text(), 'YYYY-MM-DD')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (): string {
    const image = this.image?.attr('src')
    if (image === undefined) return ''

    return `${ArangScansWorker.url}${image}`
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const chaptersElem = $('#chapters').first()

    this.chapter = chaptersElem.find('.content').first().find('a').last()
    this.chapterNum = this.chapter
    this.chapterDate = chaptersElem.find('.description').first()
    this.image = $('.image img').first()
    this.title = $('.header').first()

    return this.buildManga(url)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const response = await axios.get(`${ArangScansWorker.url}/titles`)
    const $ = cheerio.load(response.data)
    const mangaCards = $('.card')
    const promises: Promise<Manga | Error>[] = []

    mangaCards.each((_index, manga) => {
      const titleElem = $(manga).find('.header a').first()
      const title = titleElem.text().trim()
      const url = titleElem.attr('href')
      if (url === undefined) return

      const fullUrl = `${ArangScansWorker.url}${url}`

      if (this.titleContainsQuery(query, title)) {
        promises.push(this.readUrl(fullUrl))
      }
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }
}
