import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import { BaseSite } from './baseSite'
import axios from 'axios'
import cheerio from 'cheerio'
import qs from 'qs'
import moment from 'moment'

const LOGIN_URL = 'https://user.manganelo.com/login?l=mangakakalot'

export class Mangakakalot extends BaseSite {
  siteType = SiteType.Mangakakalot

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
    const chapterDate = moment(this.chapterDate?.attr('title'), 'MMM-DD-YY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return this.getDateFromNow(this.chapterDate?.attr('title'))
    }
  }

  getTestUrl (): string {
    return 'https://mangakakalot.com/manga/ui921789'
  }

  readUrl (url: string): Promise<Error | Manga> {
    return this.addToQueue(async () => {
      const response = await axios.get(url)
      const $ = cheerio.load(response.data)

      this.chapter = $('.chapter-list a').first()
      this.image = $('.manga-info-pic img').first()
      this.title = $('.manga-info-text h1').first()
      this.chapterDate = $('.chapter-list .row').first().find('span').last()

      return this.buildManga(url)
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return this.addToQueue(async () => {
      const data = qs.stringify({
        searchword: query
      })
      const response = await axios.post(`${this.getUrl()}/home_json_search`, data, {
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
    })
  }
}

interface MangakakalotSearch {
  name: string
  image: string
  lastchapter: string
  'story_link': string
}
