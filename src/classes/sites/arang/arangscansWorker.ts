import { BaseData, BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios from 'axios'
import { Manga } from '../../manga'
import cheerio from 'cheerio'
import { SiteType } from '../../../enums/siteEnum'

export class ArangScansWorker extends BaseWorker {
  static siteType = SiteType.ArangScans
  static url = BaseWorker.getUrl(ArangScansWorker.siteType)

  static testUrl = `${ArangScansWorker.url}/titles/08d93994-4f13-422a-8693-4e1b1f154a77`

  constructor () {
    super(ArangScansWorker.siteType)
  }

  getChapterUrl (data: BaseData): string {
    const chapterUrl = data.chapter?.attr('href')
    if (chapterUrl === undefined) return ''

    return `${ArangScansWorker.url}${chapterUrl}`
  }

  getChapterNum (data: BaseData): number {
    const chapterNum = data.chapterNum?.text().trim().replace('Chapter ', '')
    return this.parseNum(chapterNum)
  }

  getChapterDate (data: BaseData): string {
    const chapterDate = moment(data.chapterDate?.text(), 'YYYY-MM-DD')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (data: BaseData): string {
    const image = data.image?.attr('src')
    if (image === undefined) return ''

    return `${ArangScansWorker.url}${image}`
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const chaptersElem = $('#chapters').first()

    const data = new BaseData(url)
    data.chapter = chaptersElem.find('.content').first().find('a').last()
    data.chapterNum = data.chapter
    data.chapterDate = chaptersElem.find('.description').first()
    data.image = $('.image img').first()
    data.title = $('.header').first()

    return this.buildManga(data)
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
