import PQueue from 'p-queue'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import * as SiteUtils from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'

export class ReaperScans extends BaseSite {
  siteType = SiteType.ReaperScans

  constructor () {
    super()
    this.requestQueue = new PQueue({ interval: 1500, intervalCap: 1 })
  }

  protected getChapterNum (data: BaseData): number {
    const chapter = this.getChapter(data)
    return SiteUtils.matchNum(chapter)
  }

  protected getChapterDate (data: BaseData): string {
    return SiteUtils.getDateFromNow(
      data.chapterDate?.textContent?.toLowerCase().replace(/released/m, '')
    )
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await SiteUtils.parseHtmlFromString(response.data)
    const data = new BaseData(url)

    const titleContainer = doc.querySelectorAll('main>div:nth-child(2)>div>div')[0]
    const chapterContainer = doc.querySelectorAll('div>div>div>ul li')[0]
    const [chapter, date] = chapterContainer?.querySelectorAll('p') ?? []

    data.title = titleContainer?.querySelectorAll('h1')[0]
    data.image = titleContainer?.querySelectorAll('img')[0]
    data.chapter = chapter
    data.chapterUrl = chapterContainer?.querySelectorAll('a')[0]
    data.chapterDate = date

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    let page = 1
    let count = 30
    const mangaList: Manga[] = []

    while (count >= 30) {
      const result = await this.searchPage(query, page)
      count = result.count
      mangaList.push(...result.manga)

      page++
    }

    return mangaList
  }

  private async searchPage (query: string, page: number): Promise<{ manga: Manga[], count: number }> {
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/comics?page=${page}` }
    const response = await requestHandler.sendRequest(request)

    const doc = await SiteUtils.parseHtmlFromString(response.data)
    const comics = doc.querySelectorAll('li')
    const mangaList: Manga[] = []

    comics.forEach((element) => {
      const [imageElem, titleElem] = element.querySelectorAll('a')

      const title = titleElem?.textContent?.trim()
      if (!SiteUtils.titleContainsQuery(query, title)) return

      const url = imageElem?.getAttribute('href')
      if (!url) return

      const chapterCount = element.querySelectorAll('dl')[0]?.textContent?.trim()
      const manga = new Manga(url, this.siteType)
      manga.title = title ?? 'Unknown'
      manga.image = imageElem?.querySelectorAll('img')[0]?.getAttribute('src') ?? ''
      manga.chapter = chapterCount ?? 'Unknown'

      mangaList.push(manga)
    })

    return { manga: mangaList, count: comics.length }
  }

  getTestUrl (): string {
    return `${this.getUrl()}/comics/7346-fff-class-trashero`
  }
}
