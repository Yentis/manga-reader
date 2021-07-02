import { BaseWorker } from '../baseWorker'
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

  getChapter (): string {
    return this.chapter?.text().trim() || 'Unknown'
  }

  getChapterUrl (): string {
    const mobile = this.platform?.mobile === true
    const chapter = mobile ? this.chapter : this.chapter?.parent()

    return chapter?.attr('href') || ''
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
    const mobile = this.platform?.mobile === true

    if (!mobile) {
      const listingElem = $('.listing tbody tr').first()

      this.chapter = listingElem.find('a').first()
      this.chapterNum = this.chapter
      this.chapterDate = listingElem.children().last()
      this.image = $('.cover img').first()
      this.title = $('.w-title h1').first()

      return this.buildManga(url)
    }

    const columnElem = $('.uk-table tr').first()
    this.chapter = columnElem.find('.chico').first()
    this.chapterNum = this.chapter
    this.chapterDate = columnElem.children().last()
    this.image = $('.uk-container img').first()
    this.title = $('.uk-h1').first()

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
