import { BaseWorker } from '../baseWorker'
import axios, { AxiosRequestConfig } from 'axios'
import { Manga } from '../../manga'
import cheerio from 'cheerio'
import { SiteType } from '../../../enums/siteEnum'

export class BatotoWorker extends BaseWorker {
  static siteType = SiteType.Batoto
  static url = BaseWorker.getUrl(BatotoWorker.siteType)

  static testUrl = `${BatotoWorker.url}/series/72315/doctor-elise-the-royal-lady-with-the-lamp`

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(BatotoWorker.siteType, requestConfig)
  }

  getChapterUrl (): string {
    const url = this.chapter?.attr('href')
    if (!url) return ''

    return `${BatotoWorker.url}${url}`
  }

  getChapterNum (): number {
    return this.parseNum(this.chapterNum?.text().trim().split(' ')[1])
  }

  getImage (): string {
    return this.image?.attr('content') || ''
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    this.chapter = $('.episode-list a').eq(1)
    this.chapterDate = $('.episode-list .extra i').first()
    this.chapterNum = this.chapter
    this.image = $('meta[property="og:image"]').first()
    this.title = $('.item-title').first()

    return this.buildManga(url)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const response = await axios.get(`${BatotoWorker.url}/search?word=${encodeURIComponent(query)}`)
    const $ = cheerio.load(response.data)
    const mangaList: Manga[] = []

    $('#series-list .item').each((_index, elem) => {
      const titleElem = $(elem).find('.item-text a').first()
      const url = titleElem.attr('href')

      const manga = new Manga('', this.siteType)
      manga.title = titleElem.text().trim()
      const image = $(elem).find('img').first()
      manga.image = image.attr('data-cfsrc') || image.attr('src') || ''
      manga.chapter = $(elem).find('.item-volch a').first().text().trim()
      manga.url = url ? `${BatotoWorker.url}${url}` : ''

      if (this.titleContainsQuery(query, manga.title)) {
        mangaList.push(manga)
      }
    })

    return mangaList
  }
}
