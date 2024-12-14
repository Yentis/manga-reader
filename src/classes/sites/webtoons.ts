import { BaseData, BaseSite } from './baseSite'
import { SiteType } from 'src/enums/siteEnum'
import moment from 'moment'
import { Manga } from 'src/classes/manga'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import qs from 'qs'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import { HEADER_USER_AGENT } from '../requests/baseRequest'
import {
  getRssChapter,
  getRssChapterDate,
  getRssChapterUrl,
  getRssData,
  getRssImage,
  getRssTitle,
} from 'src/utils/rssUtils'

interface WebtoonsSearch {
  result: {
    searchedList: {
      title: string,
      titleNo: number
    }[]
  }
}

export class Webtoons extends BaseSite {
  siteType = SiteType.Webtoons

  protected getChapter (data: BaseData): string {
    return getRssChapter(data)
  }

  protected getChapterUrl (data: BaseData): string {
    return getRssChapterUrl(data)
  }

  protected getChapterNum (data: BaseData): number {
    const chapterLink = data.chapter?.querySelectorAll('link')[0]
    const chapterUrl = chapterLink?.textContent
    if (!chapterUrl) return 0

    const queryString = chapterUrl.substring(chapterUrl.indexOf('?'))
    const query = qs.parse(queryString)

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const episodeText = query.episode_no?.toString()
    if (!episodeText) return 0

    const episode = parseFloat(episodeText)
    if (isNaN(episode)) return 0

    return episode
  }

  protected getChapterDate (data: BaseData): string {
    return getRssChapterDate(data)
  }

  protected getImage (data: BaseData): string {
    return getRssImage(data)
  }

  protected getTitle (data: BaseData): string {
    return getRssTitle(data)
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    let baseUrl: string
    if (url.includes('episodeList?')) {
      const baseRequest: HttpRequest = {
        method: 'GET',
        url,
        headers: {
          cookie: `pagGDPR=true;timezoneOffset=${(moment().utcOffset() / 60).toString()}`
        }
      }

      const baseResponse = await requestHandler.sendRequest(baseRequest)
      const baseDoc = await parseHtmlFromString(baseResponse.data)

      const urlElement = baseDoc.querySelectorAll('meta[property="og:url"]')[0]
      const urlContent = urlElement?.getAttribute('content')
      if (!urlContent) return Error(`Failed to find feed for ${url}`)

      baseUrl = urlContent
    } else {
      baseUrl = url
    }

    const desktopUrl = baseUrl.replace('m.webtoons.com', 'www.webtoons.com')
    const rssUrl = desktopUrl.replace('list?title_no', 'rss?title_no').replace('/canvas/', '/challenge/')

    const headers: Record<string, string> = {}
    headers[HEADER_USER_AGENT] = ''

    const request: HttpRequest = {
      method: 'GET',
      url: rssUrl,
      headers
    }

    const data = await getRssData({ url, request })
    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({ keyword: query })
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/en/search/immediate?${queryString}` }
    const response = await requestHandler.sendRequest(request)

    const searchData = JSON.parse(response.data) as WebtoonsSearch
    const promises: Promise<Error | Manga>[] = []

    searchData.result.searchedList.forEach((result) => {
      if (!titleContainsQuery(query, result.title)) return

      const url = `${this.getUrl()}/episodeList?titleNo=${result.titleNo}`
      promises.push(this.readUrl(url))
    })

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
