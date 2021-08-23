import { BaseData, BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio, { Cheerio, Element } from 'cheerio'
import { Manga } from '../../manga'
import { SiteType } from '../../../enums/siteEnum'
import qs from 'qs'

interface ManganeloSearch {
  name: string
  image: string
  lastchapter: string
  'id_encode': string
}

class ManganeloData extends BaseData {
  currentTime?: Cheerio<Element>
}

export class ManganeloWorker extends BaseWorker {
  static siteType = SiteType.Manganelo
  static url = BaseWorker.getUrl(ManganeloWorker.siteType)
  static testUrl = `${ManganeloWorker.url}/manga/pu918807`

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(ManganeloWorker.siteType, requestConfig)
  }

  getChapterDate (data: ManganeloData): string {
    const curTime = moment(data.currentTime?.text(), '[Current Time is] MMM DD,YYYY - hh:mm:ss A')
    const chapterDate = moment(data.chapterDate?.attr('title'), 'MMM DD,YYYY hh:mm')
    if (chapterDate.isValid()) {
      return chapterDate.from(curTime)
    } else {
      return ''
    }
  }

  getChapterNum (data: BaseData): number {
    const chapter = this.getChapter(data)
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

    const data = new ManganeloData(url)
    data.chapter = $('.chapter-name').first()
    data.image = $('.info-image img').first()
    data.title = $('.story-info-right h1').first()
    data.chapterDate = $('.chapter-time').first()
    data.currentTime = $('.pn-contacts p').last()

    return this.buildManga(data)
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
