import moment from 'moment'
import qs from 'qs'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, parseNum, titleContainsQuery } from 'src/utils/siteUtils'
import { getCookies } from '../requests/baseRequest'
import { BaseData, BaseSite } from './baseSite'

interface ChaptersData {
  data: {
    body: string
  }
}

interface SearchData {
  data: {
    body: string
  }
}

export class Tapas extends BaseSite {
  siteType = SiteType.Tapas

  protected getChapterNum (data: BaseData): number {
    const chapterNum = data.chapterNum?.getAttribute('data-scene-number')
    return parseNum(chapterNum)
  }

  protected getChapterDate (data: BaseData): string {
    const chapterDate = moment(data.chapterDate?.textContent, 'MMM DD, YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const idElement = doc.querySelectorAll('meta[content*="tapastic://series"]')[0]
    const id = idElement?.getAttribute('content')?.split('/')[3]
    if (id === undefined) return Error('Failed to get ID')

    const cookies = getCookies(response)
    const sessionId = cookies.JSESSIONID || ''
    const chaptersRequest: HttpRequest = {
      method: 'GET',
      url: `${this.getUrl()}/series/${id}/episodes?sort=NEWEST&large=true`,
      headers: {
        cookie: `JSESSIONID=${sessionId}`
      }
    }

    const chaptersResponse = await requestHandler.sendRequest(chaptersRequest)
    const chaptersData = JSON.parse(chaptersResponse.data) as ChaptersData
    const chaptersDoc = await parseHtmlFromString(chaptersData.data.body)

    const data = new BaseData(url)
    let chapterElem: Element | undefined
    for (const elem of chaptersDoc.querySelectorAll('.episode-item')) {
      if (elem.querySelectorAll('.additional span').length > 0) {
        chapterElem = elem
        break
      }
    }

    data.chapter = chapterElem?.querySelectorAll('.title')[0]
    data.chapterUrl = chapterElem
    data.chapterNum = chapterElem
    data.chapterDate = chapterElem?.querySelectorAll('.additional span')[0]
    data.image = doc.querySelectorAll('.thumb img')[0]
    data.title = doc.querySelectorAll('.title-wrapper .title')[0]

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({ query })
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/search/summary?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const responseData = JSON.parse(response.data) as SearchData

    const doc = await parseHtmlFromString(responseData.data.body)
    const results = doc.querySelectorAll('.search-result__body')[0]?.querySelectorAll('.js-search-link')
    if (!results) return []

    const promises: Promise<Manga | Error>[] = []

    results.forEach((entry) => {
      const titleElem = entry.querySelectorAll('.body__desc--large')[0]
      const title = titleElem?.textContent?.trim()
      const url = entry.getAttribute('href')
      if (!url) return

      const fullUrl = `${this.getUrl()}${url}/info`
      if (titleContainsQuery(query, title)) {
        promises.push(this.readUrl(fullUrl))
      }
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl (): string {
    return `${this.getUrl()}/series/villains-are-destined-to-die/info`
  }
}
