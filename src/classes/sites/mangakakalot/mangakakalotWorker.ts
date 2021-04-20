import { BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio from 'cheerio'
import { Manga } from '../../manga'
import qs from 'qs'
import { SiteType } from '../../../enums/siteEnum'

export class MangakakalotWorker extends BaseWorker {
  static siteType = SiteType.Mangakakalot
  static url = BaseWorker.getUrl(MangakakalotWorker.siteType)
  static testUrl = `${MangakakalotWorker.url}/read-qu4wd158504821675`

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(MangakakalotWorker.siteType, requestConfig)
  }

  getChapterNum (): number {
    const chapter = this.getChapter()
    const matches = /Chapter ([-+]?[0-9]*\.?[0-9]+)/gm.exec(chapter) || []
    let num = 0

    for (const match of matches) {
      const parsedMatch = parseFloat(match)
      if (!isNaN(parsedMatch)) num = parsedMatch
    }

    return num
  }

  getChapterDate (): string {
    const chapterDate = moment(this.chapterDate?.attr('title'), 'MMM-DD-YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return this.getDateFromNow(this.chapterDate?.attr('title'))
    }
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    this.chapter = $('.chapter-list a').first()
    this.image = $('.manga-info-pic img').first()
    this.title = $('.manga-info-text h1').first()
    this.chapterDate = $('.chapter-list .row').first().find('span').last()

    return this.buildManga(url)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const data = qs.stringify({
      searchword: query
    })
    const response = await axios.post(`${MangakakalotWorker.url}/home_json_search`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const searchData = response.data as MangakakalotSearch[]
    const mangaList = []

    for (const entry of searchData) {
      const manga = new Manga('', this.siteType)
      manga.title = cheerio.load(entry.name).root().text()
      if (!this.titleContainsQuery(query, manga.title)) continue
      manga.image = entry.image
      manga.chapter = entry.lastchapter
      manga.url = entry.story_link

      mangaList.push(manga)
    }

    return mangaList
  }
}

interface MangakakalotSearch {
  name: string
  image: string
  lastchapter: string
  'story_link': string
}
