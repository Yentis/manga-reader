import moment from 'moment'
import { Guya, SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { getUrl, parseHtmlFromString, parseNum, titleContainsQuery } from 'src/utils/siteUtils'
import { Manga } from '../manga'
import { BaseData, BaseSite } from './baseSite'

export class Cubari extends BaseSite {
  siteType = SiteType.Cubari

  protected getChapter (data: BaseData): string {
    const textContent = data.chapter?.textContent
    const dashIndex = textContent?.indexOf('-') || 0

    return textContent?.substring(dashIndex + 1)?.trim() || 'Unknown'
  }

  protected getChapterUrl (data: BaseData): string {
    const chapterUrl = data.chapter?.getAttribute('href')
    if (!chapterUrl) return ''

    return `${this.getDomainFromUrl(data.url)}${chapterUrl}`
  }

  protected getChapterNum (data: BaseData): number {
    return parseNum(data.chapterNum?.getAttribute('data-chapter'))
  }

  protected getChapterDate (data: BaseData): string {
    const dateText = data.chapterDate?.textContent
    if (!dateText?.startsWith('[')) return ''

    const [year, month, day, hour, minute, second] = JSON.parse(dateText) as number[]
    const chapterDate = moment({
      year,
      month,
      day,
      hour,
      minute,
      second
    })

    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected getImage (data: BaseData): string {
    const source = data.image?.querySelectorAll('source')[0]?.getAttribute('srcset')
    if (source?.startsWith('http')) return source
    if (source) return `${this.getDomainFromUrl(data.url)}${source}`

    const imageUrl = data.image?.querySelectorAll('img')[0]?.getAttribute('src')
    if (!imageUrl) return ''
    if (imageUrl.startsWith('http')) return imageUrl

    return `${this.getDomainFromUrl(data.url)}${imageUrl}`
  }

  protected async readUrlImpl (url: string): Promise<Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    const chapterRow = doc.querySelectorAll('.table-default')[0]
    const data = new BaseData(url)

    data.chapter = chapterRow?.querySelectorAll('.chapter-title a')[0]
    data.chapterNum = chapterRow
    data.chapterDate = chapterRow?.querySelectorAll('.detailed-chapter-upload-date')[0]
    data.image = doc.querySelectorAll('picture')[0]
    data.title = doc.querySelectorAll('h1')[0]

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const guyaManga = await this.searchGuya(query)
    if (guyaManga instanceof Error) return guyaManga

    return guyaManga
  }

  private async searchGuya (query: string): Promise<Error | Manga[]> {
    const guyaUrl = getUrl(Guya)
    const request: HttpRequest = { method: 'GET', url: guyaUrl }

    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)
    const promises: Promise<Error | Manga>[] = []

    doc.querySelectorAll('.dropdown-item').forEach((element) => {
      const url = element.getAttribute('href')
      if (!url || !url.startsWith('/read/manga')) return

      const title = element.textContent?.trim()
      if (!titleContainsQuery(query, title)) return

      promises.push(this.readUrl(`${guyaUrl}${url}`))
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl (): string {
    return 'https://cubari.moe/read/gist/OPM/'
  }

  private getDomainFromUrl (url: string): string {
    const domainIndex = url.indexOf('.moe')
    return url.substring(0, domainIndex + 4)
  }
}
