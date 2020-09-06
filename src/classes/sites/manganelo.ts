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

  getLoginUrl (): string {
    return LOGIN_URL
  }

  getChapterDate (): string {
    const chapterDate = moment(this.chapterDate?.attr('title'), 'MMM DD,YYYY hh:mm')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  readUrl (url: string): Promise<Error | Manga> {
    return new Promise(resolve => {
      axios.get(url).then(response => {
        const $ = cheerio.load(response.data)
        this.chapter = $('.chapter-name').first()
        this.image = $('.info-image img').first()
        this.title = $('.story-info-right h1').first()
        this.chapterDate = $('.chapter-time').first()

        resolve(this.buildManga(url))
      }).catch(error => resolve(error))
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return new Promise(resolve => {
      const data = qs.stringify({
        searchword: query
      })

      axios.post(`${this.getUrl()}/getstorysearchjson`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(response => {
        const searchData = response.data as ManganeloSearch[]
        const mangaList = []

        for (const entry of searchData) {
          const manga = new Manga('', this.siteType)
          manga.image = entry.image
          manga.title = cheerio.load(entry.name).root().text()
          manga.chapter = entry.lastchapter
          manga.url = `${this.getUrl()}/manga/${entry.id_encode}`

          mangaList.push(manga)
        }

        resolve(mangaList)
      }).catch(error => resolve(error))
    })
  }
}

interface ManganeloSearch {
  name: string
  image: string
  lastchapter: string
  'id_encode': string
}
