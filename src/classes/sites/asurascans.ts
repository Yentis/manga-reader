import { BaseData, BaseSite } from './baseSite'
import { SiteType } from 'src/enums/siteEnum'
import PQueue from 'p-queue'
import moment from 'moment'
import { Manga } from 'src/classes/manga'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { ContentType } from 'src/enums/contentTypeEnum'
import { parseHtmlFromString, parseNum, titleContainsQuery } from '../../utils/siteUtils'
import qs from 'qs'

class AsuraData extends BaseData {
  chapterList?: Element
}

export class AsuraScans extends BaseSite {
  siteType: SiteType

  constructor() {
    super()

    this.siteType = SiteType.AsuraScans
    this.requestQueue = new PQueue({ interval: 2000, intervalCap: 1 })
  }

  protected getChapterNum(data: AsuraData): number {
    const chapterNum = parseNum(data.chapterNum?.textContent?.trim().split(' ')[1])
    if (chapterNum !== 0) return chapterNum

    const chapters = data.chapterList?.querySelectorAll('div h3:nth-child(1)')
    if (!chapters) return 0

    // Derive current chapter number based on last valid chapter number
    for (const [index, chapter] of chapters.entries()) {
      const curChapterNum = parseNum(chapter.textContent?.trim().split(' ')[1])
      if (curChapterNum === 0) continue

      return curChapterNum + index
    }

    return 0
  }

  protected getChapterDate(data: BaseData): string {
    const chapterDate = moment(data.chapterDate?.textContent, 'MMMM DD YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected getChapterUrl(data: BaseData): string {
    return `${this.getUrl()}/series/${super.getChapterUrl(data)}`
  }

  protected getImage(data: BaseData): string {
    return data.image?.getAttribute('content') ?? data.image?.getAttribute('src') ?? ''
  }

  protected async readUrlImpl(url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const chapterList = doc.querySelectorAll('.scrollbar-thumb-themecolor')[0]
    const chapterItem = chapterList?.querySelectorAll('div')[0]

    const data = new AsuraData(url)
    data.chapter = chapterItem?.querySelectorAll('a')[0]
    data.chapterUrl = data.chapter
    data.chapterNum = data.chapter
    data.chapterDate = chapterItem?.querySelectorAll('h3')[1]
    data.chapterList = chapterList
    data.title = doc.querySelectorAll('.text-xl')[0]

    const imageElements = doc.querySelectorAll('meta[property="og:image"]')
    let image: Element | undefined
    if (imageElements.length === 0) {
      image = doc.querySelectorAll('meta[name="twitter:image"]')[0] ?? doc.querySelectorAll('img[alt="poster"]')[0]
    } else image = imageElements[0]
    data.image = image

    return this.buildManga(data)
  }

  protected async searchImpl(query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({ name: query.replace(/’/g, "'") })
    const request: HttpRequest = {
      method: 'GET',
      url: `${this.getUrl()}/series?${queryString}`,
      headers: { 'Content-Type': `${ContentType.URLENCODED}; charset=UTF-8` },
    }

    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)
    const mangaList: Manga[] = []

    doc.querySelectorAll('.grid-cols-2 a').forEach((elem) => {
      const url = `${this.getUrl()}/${elem.getAttribute('href') ?? ''}`

      const manga = new Manga('', this.siteType)
      const titleElem = elem.querySelectorAll('.font-bold')[1]
      manga.title = titleElem?.textContent?.trim() || ''

      const image = elem.querySelectorAll('img')[0]
      const imageUrl = image?.getAttribute('src') || ''
      manga.image = imageUrl

      manga.chapter = titleElem?.nextElementSibling?.textContent?.trim() || 'Unknown'
      manga.url = url ?? ''

      const modifiedTitle = manga.title
        .split(' ')
        .filter((word) => !word.endsWith('...'))
        .join(' ')

      if (titleContainsQuery(modifiedTitle, query)) {
        mangaList.push(manga)
      }
    })

    return mangaList
  }

  getTestUrl(): string {
    return `${this.getUrl()}/series/mookhyang-the-origin-105d9ca4`
  }
}
