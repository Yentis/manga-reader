import { BaseData, BaseWorker } from '../baseWorker'
import axios from 'axios'
import { Manga } from '../../manga'
import cheerio from 'cheerio'
import { SiteType } from '../../../enums/siteEnum'

export class BatotoWorker extends BaseWorker {
  static siteType = SiteType.Batoto
  static url = BaseWorker.getUrl(BatotoWorker.siteType)

  static testUrl = `${BatotoWorker.url}/series/72315/doctor-elise-the-royal-lady-with-the-lamp`

  constructor () {
    super(BatotoWorker.siteType)
  }

  getChapterUrl (data: BaseData): string {
    const url = data.chapter?.attr('href')
    if (!url) return ''

    return `${BatotoWorker.url}${url}`
  }

  getChapterNum (data: BaseData): number {
    return this.parseNum(data.chapterNum?.text().trim().split(' ')[1])
  }

  getImage (data: BaseData): string {
    const image = data.image?.attr('content')
    if (image === undefined) return ''

    return this.cleanImageUrl(image)
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    const data = new BaseData(url)
    data.chapter = $('.episode-list a').eq(1)
    data.chapterDate = $('.episode-list .extra').first().children().last()
    data.chapterNum = data.chapter
    data.image = $('meta[property="og:image"]').first()
    data.title = $('.item-title').first()

    return this.buildManga(data)
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
      const imageUrl = image.attr('data-cfsrc') || image.attr('src') || ''
      manga.image = this.cleanImageUrl(imageUrl)

      manga.chapter = $(elem).find('.item-volch a').first().text().trim()
      manga.url = url ? `${BatotoWorker.url}${url}` : ''

      if (this.titleContainsQuery(query, manga.title)) {
        mangaList.push(manga)
      }
    })

    return mangaList
  }

  private cleanImageUrl (url: string) {
    // Get rid of the query string
    return url.substring(0, url.lastIndexOf('?'))
  }
}
