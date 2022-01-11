import { BaseData, BaseSite } from './baseSite'
import { SiteType } from 'src/enums/siteEnum'
import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { getPlatform } from 'src/services/platformService'
import { Platform } from 'src/enums/platformEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import qs from 'qs'
import { parseHtmlFromString, parseNum, titleContainsQuery } from 'src/utils/siteUtils'
import { HEADER_USER_AGENT, MOBILE_USER_AGENT } from '../requests/baseRequest'

interface WebtoonsSearch {
  query: string[]
  items: string[][][][]
}

class WebtoonsData extends BaseData {
  chapterUrl?: Element
}

export class Webtoons extends BaseSite {
  siteType = SiteType.Webtoons

  getChapterNum (data: BaseData): number {
    return parseNum(data.chapterNum?.getAttribute('data-episode-no'))
  }

  getChapterUrl (data: WebtoonsData): string {
    return data.chapterUrl?.getAttribute('href') || ''
  }

  getChapterDate (data: BaseData): string {
    const chapterDateText = data.chapterDate?.textContent?.trim()
    if (!chapterDateText) return ''

    const chapterDate = moment(chapterDateText, 'MMM DD, YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (data: BaseData): string {
    return data.image?.getAttribute('content') || ''
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const mobile = url.includes('//m.' + this.siteType)
    const platform = getPlatform()
    const headers: Record<string, string> = {}

    if (mobile && platform !== Platform.Cordova) {
      headers[HEADER_USER_AGENT] = MOBILE_USER_AGENT
    }

    const request: HttpRequest = {
      method: 'GET',
      url,
      headers: {
        ...headers,
        cookie: `pagGDPR=true;timezoneOffset=${(moment().utcOffset() / 60).toString()}`
      }
    }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    const data = new WebtoonsData(url)
    data.image = doc.querySelectorAll('meta[property="og:image"]')[0]
    data.chapterDate = doc.querySelectorAll('.date')[0]

    if (mobile || platform === Platform.Cordova) {
      data.chapter = doc.querySelectorAll('.sub_title span')[0]
      data.chapterUrl = doc.querySelectorAll('li[data-episode-no] a')[0]
      data.chapterNum = doc.querySelectorAll('#_episodeList li[data-episode-no]')[0]
      data.title = doc.querySelectorAll('._btnInfo .subj')[0]
    } else {
      data.chapter = doc.querySelectorAll('#_listUl .subj span')[0]
      data.chapterUrl = doc.querySelectorAll('#_listUl a')[0]
      data.chapterNum = doc.querySelectorAll('#_listUl li')[0]
      data.title = doc.querySelectorAll('.info .subj')[0]
    }

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      q: `en^${query}`,
      st: 1
    })
    const request: HttpRequest = { method: 'GET', url: `https://ac.${this.siteType}/ac?${queryString}` }
    const response = await requestHandler.sendRequest(request)

    const searchData = JSON.parse(response.data) as WebtoonsSearch
    const promises: Promise<Error | Manga>[] = []

    for (const firstIndent of searchData.items) {
      for (const item of firstIndent) {
        const title = item[0]?.[0]
        if (!titleContainsQuery(query, title)) continue

        const titleNo = item[3]?.[0]
        if (!titleNo) continue

        const url = `${this.getUrl()}/episodeList?titleNo=${titleNo}`
        promises.push(this.readUrl(url))
      }
    }

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getUrl (): string {
    return `https://www.${this.siteType}`
  }

  getLoginUrl (): string {
    return this.getUrl()
  }

  getTestUrl (): string {
    return `${this.getUrl()}/en/comedy/wolf-and-red-riding-hood/list?title_no=2142`
  }
}
