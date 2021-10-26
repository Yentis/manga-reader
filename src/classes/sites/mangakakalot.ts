import moment from 'moment'
import { ContentType } from 'src/enums/contentTypeEnum'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { getDateFromNow, parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import constants from '../constants'
import { Manga } from '../manga'
import { BaseData, BaseSite } from './baseSite'
import { Manganelo } from './manganelo'

interface MangakakalotSearch {
  name: string
  image: string
  lastchapter: string
  'story_link': string
}

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
      method: 'POST',
      url: `${this.getUrl()}/home_json_search`,
      data: JSON.stringify({ searchword: query }),
      headers: { 'Content-Type': ContentType.URLENCODED }
    }
    const response = await requestHandler.sendRequest(request)

    const searchData = JSON.parse(response.data) as MangakakalotSearch[]
    const mangaList = []
    const parser = new DOMParser()

    for (const entry of searchData) {
      const manga = new Manga('', this.siteType)
      const docElement = (await parseHtmlFromString(entry.name, parser)).documentElement

      manga.title = docElement.textContent || ''
      if (!titleContainsQuery(query, manga.title)) continue

      manga.image = entry.image
      manga.chapter = entry.lastchapter
      manga.url = entry.story_link

      mangaList.push(manga)
    }

    return mangaList
  }

  getLoginUrl (): string {
    return `https://user.${Manganelo.siteType}/login?l=mangakakalot`
  }

  getTestUrl (): string {
    return `${this.getUrl()}/read-qu4wd158504821675`
  }
}
