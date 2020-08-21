import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import { BaseSite } from './baseSite'
import axios from 'axios'
import cheerio from 'cheerio'
import qs from 'qs'

const LOGIN_URL = 'https://user.manganelo.com/login?l=mangakakalot'

export class Mangakakalot extends BaseSite {
  siteType = SiteType.Mangakakalot

  getLoginUrl (): string {
    return LOGIN_URL
  }

  readUrl (url: string): Promise<Manga> {
    return new Promise((resolve, reject) => {
      axios.get(url).then(response => {
        const $ = cheerio.load(response.data)
        this.chapter = $('.chapter-list a').first()
        this.image = $('.manga-info-pic img').first()
        this.title = $('.manga-info-text h1').first()

        resolve(this.buildManga(url))
      }).catch(error => reject(error))
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return new Promise(resolve => {
      const data = qs.stringify({
        searchword: query
      })

      axios.post(`${this.getUrl()}/home_json_search`, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then(response => {
        const searchData = response.data as MangakakalotSearch[]
        const mangaList = []

        for (const entry of searchData) {
          const manga = new Manga('', this.siteType)
          manga.image = entry.image
          manga.title = cheerio.load(entry.name).root().text()
          manga.chapter = entry.lastchapter
          manga.url = entry.story_link

          mangaList.push(manga)
        }

        resolve(mangaList)
      }).catch(error => resolve(error))
    })
  }
}

interface MangakakalotSearch {
  name: string
  image: string
  lastchapter: string
  'story_link': string
}
