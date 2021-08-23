import { BaseData, BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio from 'cheerio'
import { Manga } from '../../manga'
import qs from 'qs'
import { LooseDictionary } from 'quasar'
import { SiteType } from '../../../enums/siteEnum'

export class MangagoWorker extends BaseWorker {
  static siteType = SiteType.Mangago
  static url = `${BaseWorker.urlPrefix}https://www.${MangagoWorker.siteType}`
  static testUrl = `${MangagoWorker.url}/read-manga/curtain/`

  platform: LooseDictionary | undefined

  constructor (platform: LooseDictionary | undefined = undefined, requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(MangagoWorker.siteType, requestConfig)
    this.platform = platform
  }

  getChapter (data: BaseData): string {
    return data.chapter?.text().trim() || 'Unknown'
  }

  getChapterUrl (data: BaseData): string {
    return data.chapter?.attr('href') || ''
  }

  getChapterNum (data: BaseData): number {
    return this.parseNum(data.chapterNum?.text().split('Ch.')[1])
  }

  getChapterDate (data: BaseData): string {
    const chapterDate = moment(data.chapterDate?.text().trim(), 'MMM DD, YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url, this.requestConfig)
    const $ = cheerio.load(response.data)
    const mobile = this.platform?.mobile === true
    const data = new BaseData(url)

    if (!mobile) {
      const listingElem = $('.listing tbody tr').first()

      data.chapter = listingElem.find('a').first()
      data.chapterNum = data.chapter
      data.chapterDate = listingElem.children().last()
      data.image = $('.cover img').first()
      data.title = $('.w-title h1').first()

      return this.buildManga(data)
    }

    const columnElem = $('.uk-table tr').first()
    data.chapter = columnElem.find('.chico').first()
    data.chapterNum = data.chapter
    data.chapterDate = columnElem.children().last()
    data.image = $('.uk-container img').first()
    data.title = $('.uk-h1').first()

    return this.buildManga(data)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      name: query
    })

    const response = await axios.get(`${MangagoWorker.url}/r/l_search/?${queryString}`, this.requestConfig)
    const $ = cheerio.load(response.data)
    const mangaList: Manga[] = []

    const missingChapterUrls: string[] = []
    const promises: Promise<Error | Manga>[] = []

    $('#search_list li').each((_index: number, element) => {
      const manga = new Manga('', this.siteType)
      const titleElem = $(element).find('.tit a')
      manga.title = titleElem.first().text().trim() || ''

      if (this.titleContainsQuery(query, manga.title)) {
        manga.chapter = $(element).find('.chico').first().text().trim() || 'Unknown'
        manga.url = titleElem.first().attr('href') || ''

        // Some chapters aren't listed on the search results page
        if (manga.chapter === 'Unknown') {
          missingChapterUrls.push(manga.url)
        } else {
          manga.image = $(element).find('.left img').first().attr('src') || ''

          mangaList.push(manga)
        }
      }
    })

    for (let i = 0; i < missingChapterUrls.length; i++) {
      promises.push(this.readUrl(missingChapterUrls[i]))
    }

    const missingMangaList = await Promise.all(promises)
    return mangaList.concat(missingMangaList.filter(manga => manga instanceof Manga) as Manga[])
  }
}
