import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'
import * as SiteUtils from 'src/utils/siteUtils'

export class ScyllaScans extends BaseSite {
  siteType = SiteType.ScyllaScans

  protected getChapterNum(data: BaseData): number {
    return SiteUtils.parseNum(data.chapterNum?.textContent?.trim().split(' ')[1])
  }

  protected override getTitle(data: BaseData): string {
    return data.title?.childNodes[0]?.textContent?.trim() ?? ''
  }

  protected async readUrlImpl(url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const data = new BaseData(url)

    const chaptersList = doc.querySelectorAll('#chapters-list')[0]
    data.chapter = chaptersList?.querySelectorAll('span')[0]
    data.chapterUrl = chaptersList?.querySelectorAll('a')[0]
    data.chapterNum = data.chapter
    data.chapterDate = chaptersList?.querySelectorAll('span')[1]

    data.title = doc.querySelectorAll('h2')[0]
    const title = this.getTitle(data)
    data.image = doc.querySelectorAll(`img[alt="${title}"]`)[0]

    return this.buildManga(data)
  }

  protected async searchImpl(query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/manga?title=${encodeURIComponent(query)}` }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const promises: Promise<Manga | Error>[] = []

    doc.querySelectorAll('#card-real').forEach((elem) => {
      const titleElem = elem.querySelectorAll('img')[0]
      const title = titleElem?.getAttribute('alt')?.trim() ?? ''
      if (!titleContainsQuery(query, title)) return

      const url = elem.querySelectorAll('a')[0]?.href ?? ''
      if (!url) return

      promises.push(this.readUrl(url))
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter((manga) => manga instanceof Manga) as Manga[]
  }

  getTestUrl(): string {
    return `${this.getUrl()}/manga/one-in-a-hundred`
  }
}
