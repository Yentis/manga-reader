import { BaseData, BaseSite } from './baseSite'
import { SiteType } from 'src/enums/siteEnum'
import moment from 'moment'
import { Manga } from 'src/classes/manga'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import qs from 'qs'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import { HEADER_USER_AGENT } from '../requests/baseRequest'

interface WebtoonsSearch {
  query: string[]
  items: string[][][][]
}

export class Webtoons extends BaseSite {
  siteType = SiteType.Webtoons

  protected getChapter (data: BaseData): string {
    const chapterTitle = data.chapter?.querySelectorAll('title')[0]
    const chapterText = chapterTitle?.textContent
    if (!chapterText) return 'Unknown'

    return this.removeCdata(chapterText)
  }

  protected getChapterUrl (data: BaseData): string {
    const chapterLink = data.chapter?.querySelectorAll('link')[0]
    return chapterLink?.textContent || ''
  }

  protected getChapterNum (data: BaseData): number {
    const chapterLink = data.chapter?.querySelectorAll('link')[0]
    const chapterUrl = chapterLink?.textContent
    if (!chapterUrl) return 0

    const queryString = chapterUrl.substring(chapterUrl.indexOf('?'))
    const query = qs.parse(queryString)

    const episodeText = query.episode_no?.toString()
    if (!episodeText) return 0

    const episode = parseFloat(episodeText)
    if (isNaN(episode)) return 0

    return episode
  }

  protected getChapterDate (data: BaseData): string {
    const chapterDateText = data.chapterDate?.textContent?.trim()
    if (!chapterDateText) return ''

    const chapterDate = moment(chapterDateText, 'dddd, DD MMM YYYY HH:mm:ss')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected getImage (data: BaseData): string {
    return data.image?.textContent || ''
  }

  protected getTitle (data: BaseData): string {
    const titleText = data.title?.textContent
    if (!titleText) return ''

    return this.removeCdata(titleText)
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
    const rssUrl = desktopUrl.replace('list?title_no', 'rss?title_no')

    const headers: Record<string, string> = {}
    headers[HEADER_USER_AGENT] = ''

    const request: HttpRequest = {
      method: 'GET',
      url: rssUrl,
      headers
    }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data, undefined, 'text/xml')

    const channel = doc.querySelectorAll('channel')[0]
    const data = new BaseData(url)

    data.image = channel?.querySelectorAll('image url')[0]
    data.title = channel?.querySelectorAll('title')[0]

    const chapter = channel?.querySelectorAll('item')[0]
    data.chapter = chapter
    data.chapterNum = chapter?.querySelectorAll('title')[0]
    data.chapterDate = chapter?.querySelectorAll('pubDate')[0]

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

  private removeCdata (content: string): string {
    return content.replace('<![CDATA[', '').replace(']]>', '').trim()
  }
}
