import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'
import * as SiteUtils from 'src/utils/siteUtils'

export class ScyllaScans extends BaseSite {
  siteType = SiteType.ScyllaScans

  protected getChapterNum (data: BaseData): number {
    const chapterNum = data.chapterNum?.textContent?.trim().replace('#', '')
    return SiteUtils.parseNum(chapterNum)
  }

  protected getChapterDate (data: BaseData): string {
    const chapterDateText = data.chapterDate?.textContent
    if (!chapterDateText) return ''

    const chapterDate = moment(new Date(chapterDateText))
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected getImage (data: BaseData): string {
    return data.image?.getAttribute('content') || ''
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const data = new BaseData(url)

    const chapterElement = doc.querySelectorAll('[class^=Chapter__ChapterItem]')[0]
    data.chapter = chapterElement?.querySelectorAll('[class^=styles__ChapterTitle]')[0]
    data.chapterUrl = chapterElement
    data.chapterNum = chapterElement?.querySelectorAll('[class^=styles__ChapterNum]')[0]
    data.chapterDate = chapterElement?.querySelectorAll('[class^=Chapter__ChapterLastUpdate]')[0]
    data.image = doc.querySelectorAll('meta[property="og:image"]')[0]
    data.title = doc.querySelectorAll('h4')[0]

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/work/all?q=${encodeURIComponent(query)}` }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const promises: Promise<Manga | Error>[] = []

    doc.querySelectorAll('[class^=WorkItem__ListItem]').forEach((elem) => {
      const titleElem = elem.querySelectorAll('[class^=WorkItem__ListContent]')[0]
      const title = titleElem?.textContent?.trim() || ''
      if (!titleContainsQuery(query, title)) return

      const relativeUrl = titleElem?.querySelectorAll('a')[0]?.getAttribute('as')
      if (!relativeUrl) return

      promises.push(this.readUrl(`${this.getUrl()}${relativeUrl}`))
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl (): string {
    return `${this.getUrl()}/work/en/one_in_a_hundred_`
  }
}
