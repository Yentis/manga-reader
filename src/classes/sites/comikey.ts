import qs from 'qs'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { getRssChapter, getRssChapterDate, getRssChapterUrl, getRssData, getRssTitle } from 'src/utils/rssUtils'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'

export class Comikey extends BaseSite {
  siteType = SiteType.Comikey

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

    const chapterRegex = (/episode-([^\\/]*)/.exec(chapterUrl)) ?? (/chapter-([^\\/]*)/.exec(chapterUrl))
    const chapterText = chapterRegex?.[1]
    if (!chapterText) return 0

    const chapterNum = parseFloat(chapterText)
    if (isNaN(chapterNum)) return 0

    return chapterNum
  }

  protected getChapterDate (data: BaseData): string {
    return getRssChapterDate(data)
  }

  protected getTitle (data: BaseData): string {
    return getRssTitle(data)
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const rssFeeds = doc.querySelectorAll('link[type="application/rss+xml"]')
    const rssUrl = (rssFeeds.length > 0 ? rssFeeds[rssFeeds.length - 1] : undefined)?.getAttribute('href')
    if (!rssUrl) return Error('Could not find RSS url')

    const rssRequest: HttpRequest = { method: 'GET', url: `${this.getUrl()}${rssUrl}` }
    const data = await getRssData(url, rssRequest)
    data.image = doc.querySelectorAll('.item-preview img')[0]

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      cover: true,
      q: query
    })

    const request: HttpRequest = {
      method: 'GET',
      url: `${this.getUrl()}/comics/suggestions.json?${queryString}`
    }

    const response = await requestHandler.sendRequest(request)
    const responseData = JSON.parse(response.data) as unknown[]
    if (!responseData) return []

    const titles = (responseData[1] ?? []) as string[]
    const urls = (responseData[3] ?? []) as string[]
    const promises: Promise<Manga | Error>[] = []

    titles.forEach((title, index) => {
      if (!titleContainsQuery(query, title)) return
      const url = urls[index]
      if (!url) return

      promises.push(this.readUrl(url))
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl (): string {
    return `${this.getUrl()}/comics/to-be-winner-webtoon/23/`
  }
}
