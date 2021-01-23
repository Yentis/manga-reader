import { BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio from 'cheerio'
import { Manga } from '../../manga'
import qs from 'qs'
import { SiteType } from '../../../enums/siteEnum'

export class MangagoWorker extends BaseWorker {
  static siteType = SiteType.Mangago
  static url = `http://www.${MangagoWorker.siteType}`
  static testUrl = `${MangagoWorker.url}/read-manga/curtain/`

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(MangagoWorker.siteType, requestConfig)
  }

  getChapter (): string {
    return this.chapter?.children('b').text().trim() || 'Unknown'
  }

  getChapterNum (): number {
    return this.parseNum(this.chapterNum?.text().split('Ch.')[1])
  }

  getChapterDate (): string {
    const chapterDate = moment(this.chapterDate?.text().trim(), 'MMM DD, YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url, this.requestConfig)
    const $ = cheerio.load(response.data)
    const listingElem = $('.listing a')

    this.chapter = listingElem.first()
    this.chapterNum = listingElem.first().children('b')
    this.chapterDate = $('.listing .no').first()
    this.image = $('.cover img').first()
    this.title = listingElem.first().contents().first()

    return this.buildManga(url)
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

    $('#search_list li').each((_index: number, element: cheerio.Element) => {
      const manga = new Manga('', this.siteType)
      const titleElem = $(element).find('.tit a')
      manga.title = titleElem.first().text().trim() || 'Unknown'

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
