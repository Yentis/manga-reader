import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import { BaseSite } from './baseSite'
import axios from 'axios'
import cheerio from 'cheerio'
import qs from 'qs'
import moment from 'moment'

const SITE_TYPE = SiteType.Manganelo
const LOGIN_URL = `https://user.${SITE_TYPE}/login?l=manganelo`

export class Manganelo extends BaseSite {
  siteType = SITE_TYPE
  currentTime: cheerio.Cheerio | undefined

  constructor () {
    super()
    void this.checkState()
  }

  getLoginUrl (): string {
    return LOGIN_URL
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
    const curTime = moment(this.currentTime?.text(), '[Current Time is] MMM DD,YYYY - hh:mm:ss A')
    const chapterDate = moment(this.chapterDate?.attr('title'), 'MMM DD,YYYY hh:mm')
    if (chapterDate.isValid()) {
      return chapterDate.from(curTime)
    } else {
      return ''
    }
  }

  getTestUrl (): string {
    return 'https://manganelo.com/manga/pu918807'
  }

  readUrl (url: string): Promise<Error | Manga> {
    return this.addToQueue(async () => {
      const response = await axios.get(url)
      const $ = cheerio.load(response.data)

      this.chapter = $('.chapter-name').first()
      this.image = $('.info-image img').first()
      this.title = $('.story-info-right h1').first()
      this.chapterDate = $('.chapter-time').first()
      this.currentTime = $('.pn-contacts p').first()

      return this.buildManga(url)
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return this.addToQueue(async () => {
      const data = qs.stringify({
        searchword: query
      })
      const response = await axios.post(`${this.getUrl()}/getstorysearchjson`, data, {
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
        manga.url = `${this.getUrl()}/manga/${entry.id_encode}`

        mangaList.push(manga)
      }

      return mangaList
    })
  }
}

interface ManganeloSearch {
  name: string
  image: string
  lastchapter: string
  'id_encode': string
}
