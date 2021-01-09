import { BaseSite } from './baseSite'
import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import axios from 'axios'
import cheerio from 'cheerio'
import moment from 'moment'
import qs from 'qs'

const SITE_TYPE = SiteType.Mangago

export class Mangago extends BaseSite {
  siteType = SITE_TYPE

  getUrl (): string {
    return `http://www.${this.siteType}`
  }

  getLoginUrl (): string {
    return `${this.getUrl()}/home/accounts/login/`
  }

  getTestUrl (): string {
    return `${this.getUrl()}/read-manga/curtain/`
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

  readUrl (url: string): Promise<Error | Manga> {
    return this.addToQueue(async () => {
      const response = await axios.get(url, this.requestConfig)
      const $ = cheerio.load(response.data)
      const listingElem = $('.listing a')

      this.chapter = listingElem.first()
      this.chapterNum = listingElem.first().children('b')
      this.chapterDate = $('.listing .no').first()
      this.image = $('.cover img').first()
      this.title = listingElem.first().contents().first()

      return this.buildManga(url)
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return this.addToQueue(async () => {
      const queryString = qs.stringify({
        name: query
      })

      const response = await axios.get(`${this.getUrl()}/r/l_search/?${queryString}`, this.requestConfig)
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
    })
  }
}
