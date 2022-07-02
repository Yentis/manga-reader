import moment from 'moment'
import { ContentType } from 'src/enums/contentTypeEnum'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import { Manga } from '../manga'
import { BaseData, BaseSite } from './baseSite'

interface ManganatoSearch {
  name: string
  image: string
  lastchapter: string
  'link_story': string
}

class ManganatoData extends BaseData {
  currentTime?: Element
}

export class Manganato extends BaseSite {
  static siteType = SiteType.Manganato
  siteType = Manganato.siteType

  getChapterDate (data: ManganatoData): string {
    const curTime = moment(data.currentTime?.textContent, '[Current Time is] MMM DD,YYYY - hh:mm:ss A')
    const chapterDate = moment(data.chapterDate?.getAttribute('title'), 'MMM DD,YYYY hh:mm')
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

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    const data = new ManganatoData(url)
    data.chapter = doc.querySelectorAll('.chapter-name')[0]
    data.image = doc.querySelectorAll('.info-image img')[0]
    data.title = doc.querySelectorAll('.story-info-right h1')[0]
    data.chapterDate = doc.querySelectorAll('.chapter-time')[0]

    const contactElems = doc.querySelectorAll('.pn-contacts p')
    data.currentTime = contactElems[contactElems.length - 1]

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = {
      method: 'POST',
      url: `${this.getUrl()}/getstorysearchjson`,
      data: JSON.stringify({ searchword: query }),
      headers: { 'Content-Type': ContentType.URLENCODED }
    }
    const response = await requestHandler.sendRequest(request)

    const searchData = JSON.parse(response.data) as ManganatoSearch[]
    const mangaList = []
    const parser = new DOMParser()

    for (const entry of searchData) {
      const manga = new Manga('', this.siteType)
      const docElement = (await parseHtmlFromString(entry.name, parser)).documentElement

      manga.title = docElement.textContent || ''
      if (!titleContainsQuery(query, manga.title)) continue

      manga.image = entry.image
      manga.chapter = entry.lastchapter
      manga.url = entry.link_story

      mangaList.push(manga)
    }

    return mangaList
  }

  getLoginUrl (): string {
    return 'https://user.manganelo.com/login?l=manganato'
  }

  getTestUrl (): string {
    return `${this.getUrl()}/manga-dt981276`
  }
}
