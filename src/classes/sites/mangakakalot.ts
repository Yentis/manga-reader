import moment from 'moment'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { getDateFromNow, parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import constants from '../constants'
import { Manga } from '../manga'
import { BaseData, BaseSite } from './baseSite'

export class Mangakakalot extends BaseSite {
  siteType = SiteType.Mangakakalot

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
    const chapterDate = moment(data.chapterDate?.getAttribute('title'), 'MMM-DD-YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return getDateFromNow(data.chapterDate?.getAttribute('title'))
    }
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    const script = doc.querySelectorAll('script')[0]?.innerHTML.trim() || ''
    if (script.startsWith('window.location.assign')) {
      const target = script.replace('window.location.assign("', '').replace('");', '')
      return Error(`${constants.REDIRECT_PREFIX}${target}`)
    }

    const data = new BaseData(url)
    data.chapter = doc.querySelectorAll('.chapter-list a')[0]
    data.image = doc.querySelectorAll('.manga-info-pic img')[0]
    data.title = doc.querySelectorAll('.manga-info-text h1')[0]
    const spanElements = doc.querySelectorAll('.chapter-list .row')[0]?.querySelectorAll('span')
    data.chapterDate = spanElements?.item(spanElements.length - 1)

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = {
      method: 'GET',
      url: `${this.getUrl()}/search/story/${encodeURIComponent(query)}`,
    }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const searchItems = doc.querySelectorAll('.story_item')
    const mangaList = []

    for (const item of searchItems) {
      const url = item.querySelectorAll('a')[0]?.getAttribute('href')
      if (!url) continue

      const data = new BaseData(url)
      data.title = item.querySelectorAll('.story_name')[0]
      data.image = item.querySelectorAll('img')[0]
      data.chapter = item.querySelectorAll('.story_chapter')[0]

      const manga = this.buildManga(data)
      if (!titleContainsQuery(query, manga.title)) continue

      mangaList.push(manga)
    }

    return mangaList
  }

  getUrl (): string {
    return `https://www.${this.siteType}`
  }

  getLoginUrl (): string {
    return 'https://user.manganelo.com/login?l=mangakakalot'
  }

  getTestUrl (): string {
    return `${this.getUrl()}/manga/osananajimi-ni-najimitai`
  }
}
