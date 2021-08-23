import { BaseData, BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio from 'cheerio'
import { Manga } from '../../manga'
import qs from 'qs'
import { SiteType } from '../../../enums/siteEnum'
import constants from 'src/classes/constants'

interface MangakakalotSearch {
  name: string
  image: string
  lastchapter: string
  'story_link': string
}

export class MangakakalotWorker extends BaseWorker {
  static siteType = SiteType.Mangakakalot
  static url = BaseWorker.getUrl(MangakakalotWorker.siteType)
  static testUrl = `${MangakakalotWorker.url}/read-qu4wd158504821675`

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(MangakakalotWorker.siteType, requestConfig)
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

  getChapterDate (data: BaseData): string {
    const chapterDate = moment(data.chapterDate?.attr('title'), 'MMM-DD-YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return this.getDateFromNow(data.chapterDate?.attr('title'))
    }
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    const script = $('script').html()?.trim()
    if (script?.startsWith('window.location.assign')) {
      const target = script.replace('window.location.assign("', '').replace('");', '')
      return Error(`${constants.REDIRECT_PREFIX}${target}`)
    }

    const data = new BaseData(url)
    data.chapter = $('.chapter-list a').first()
    data.image = $('.manga-info-pic img').first()
    data.title = $('.manga-info-text h1').first()
    data.chapterDate = $('.chapter-list .row').first().find('span').last()

    return this.buildManga(data)
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
