import { BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio from 'cheerio'
import { Manga } from '../../manga'
import { SiteType } from '../../../enums/siteEnum'
import qs from 'qs'

export class ManganeloWorker extends BaseWorker {
  static siteType = SiteType.Manganelo
  static url = BaseWorker.getUrl(ManganeloWorker.siteType)
  static testUrl = `${ManganeloWorker.url}/manga/pu918807`

  currentTime: cheerio.Cheerio | undefined

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(ManganeloWorker.siteType, requestConfig)
  }

  getChapterDate (): string {
    const curTime = moment(this.currentTime?.text(), '[Current Time is] MMM DD,YYYY - hh:mm:ss A')
    const chapterDate = moment(this.chapterDate?.attr('title'), 'MMM DD,YYYY hh:mm')
    if (chapterDate.isValid()) {
      return chapterDate.from(curTime)
    } else {
      return ''
    }
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

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    this.chapter = $('.chapter-name').first()
    this.image = $('.info-image img').first()
    this.title = $('.story-info-right h1').first()
    this.chapterDate = $('.chapter-time').first()
    this.currentTime = $('.pn-contacts p').first()

    return this.buildManga(url)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const data = qs.stringify({
      searchword: query
    })
    const response = await axios.post(`${ManganeloWorker.url}/getstorysearchjson`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const searchData = response.data as ManganeloSearch[]
    const mangaList = []

    for (const entry of searchData) {
      const manga = new Manga('', this.siteType)
      manga.title = cheerio.load(entry.name).root().text()
      if (!this.titleContainsQuery(query, manga.title)) continue
      manga.image = entry.image
      manga.chapter = entry.lastchapter
      manga.url = `${ManganeloWorker.url}/manga/${entry.id_encode}`

      mangaList.push(manga)
    }

    return mangaList
  }
}

interface ManganeloSearch {
  name: string
  image: string
  lastchapter: string
  'id_encode': string
}
