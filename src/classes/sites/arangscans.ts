import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, parseNum, titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'

export class ArangScans extends BaseSite {
  siteType = SiteType.ArangScans

  getChapterUrl (data: BaseData): string {
    const chapterUrl = data.chapter?.getAttribute('href')
    if (!chapterUrl) return ''

    return `${this.getUrl()}${chapterUrl}`
  }

  getChapterNum (data: BaseData): number {
    const chapterNum = data.chapterNum?.textContent?.trim().replace('Chapter ', '')
    return parseNum(chapterNum)
  }

  getChapterDate (data: BaseData): string {
    const chapterDate = moment(data.chapterDate?.textContent, 'YYYY-MM-DD')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (data: BaseData): string {
    const image = data.image?.getAttribute('src')
    if (!image) return ''

    return `${this.getUrl()}${image}`
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const chaptersElem = doc.querySelectorAll('#chapters')[0]

    const data = new BaseData(url)
    const aElements = chaptersElem?.querySelectorAll('.content')[0]?.querySelectorAll('a')
    data.chapter = aElements?.item(aElements.length - 1)
    data.chapterNum = data.chapter
    data.chapterDate = chaptersElem?.querySelectorAll('.description')[0]
    data.image = doc.querySelectorAll('.image img')[0]
    data.title = doc.querySelectorAll('.header')[0]

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/titles` }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const mangaCards = doc.querySelectorAll('.card')
    const promises: Promise<Manga | Error>[] = []

    mangaCards.forEach((manga) => {
      const titleElem = manga.querySelectorAll('.header a')[0]
      const title = titleElem?.textContent?.trim()
      const url = titleElem?.getAttribute('href')
      if (!url) return

      const fullUrl = `${this.getUrl()}${url}`

      if (titleContainsQuery(query, title)) {
        promises.push(this.readUrl(fullUrl))
      }
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl (): string {
    return `${this.getUrl()}/titles/08d93994-4f13-422a-8693-4e1b1f154a77`
  }
}
