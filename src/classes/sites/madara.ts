import { BaseData, BaseSite } from './baseSite'
import { SiteType } from 'src/enums/siteEnum'
import moment from 'moment'
import { Manga } from 'src/classes/manga'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { ContentType } from 'src/enums/contentTypeEnum'
import { parseHtmlFromString, parseNum, titleContainsQuery } from '../../utils/siteUtils'
import qs from 'qs'
import HttpResponse from 'src/interfaces/httpResponse'

interface MadaraSearch {
  series: {
    all: {
      ID: number
      // eslint-disable-next-line camelcase
      post_title: string
      // eslint-disable-next-line camelcase
      post_image: string
      // eslint-disable-next-line camelcase
      post_latest: string
      // eslint-disable-next-line camelcase
      post_link: string
    }[]
  }[]
}

class MadaraData extends BaseData {
  chapterList?: Element
}

export class Madara extends BaseSite {
  siteType: SiteType

  constructor(siteType: SiteType) {
    super()
    this.siteType = siteType
  }

  protected getChapterNum(data: MadaraData): number {
    const chapterNum = parseNum(data.chapterNum?.getAttribute('data-num'))
    if (chapterNum !== 0) return chapterNum

    const chapters = data.chapterList?.querySelectorAll('li')
    if (!chapters) return 0

    // Derive current chapter number based on last valid chapter number
    for (const [index, chapter] of chapters.entries()) {
      const curChapterNum = parseNum(chapter.getAttribute('data-num'))
      if (curChapterNum === 0) continue

      return curChapterNum + index
    }

    return 0
  }

  protected getChapterDate(data: BaseData): string {
    const chapterDate = moment(data.chapterDate?.textContent, 'MMMM DD, YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected getImage(data: BaseData): string {
    return data.image?.getAttribute('content') ?? data.image?.getAttribute('src') ?? ''
  }

  protected async readUrlImpl(url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const chapterList = doc.querySelectorAll('#chapterlist')[0]
    const chapterItem = chapterList?.querySelectorAll('li')[0]

    const data = new MadaraData(url)
    data.chapter = chapterItem?.querySelectorAll('.chapternum')[0]
    data.chapterUrl = chapterItem?.querySelectorAll('a')[0]
    data.chapterNum = chapterItem
    data.chapterDate = chapterItem?.querySelectorAll('.chapterdate')[0]
    data.chapterList = chapterList
    data.title = doc.querySelectorAll('.entry-title')[0]

    const imageElements = doc.querySelectorAll('meta[property="og:image"]')
    let image: Element | undefined
    if (imageElements.length === 0) {
      image = doc.querySelectorAll('meta[name="twitter:image"]')[0] ?? doc.querySelectorAll('.wp-post-image')[0]
    } else image = imageElements[0]
    data.image = image

    return this.buildManga(data)
  }

  protected async searchImpl(query: string): Promise<Error | Manga[]> {
    const response = await this.sendAdminRequest(`ts_ac_do_search&ts_ac_query=${encodeURIComponent(query)}`)
    if (response.status >= 400) {
      return await this.searchFallback(query)
    }

    const searchData = JSON.parse(response.data) as MadaraSearch
    if (!searchData.series) {
      return []
    }
    const mangaList = []

    for (const entry of searchData.series) {
      for (const entryItem of entry.all) {
        if (!titleContainsQuery(query, entryItem.post_title)) continue

        const manga = new Manga('', this.siteType)
        manga.title = entryItem.post_title
        manga.image = entryItem.post_image
        manga.chapter = entryItem.post_latest

        let queryParam: string
        if (this.siteType === SiteType.LuminousScans) {
          queryParam = 'series?p'
        } else {
          queryParam = '?p'
        }
        manga.url = `${this.getUrl()}/${queryParam}=${entryItem.ID}`

        mangaList.push(manga)
      }
    }

    return mangaList
  }

  private async sendAdminRequest(action: string): Promise<HttpResponse> {
    const request: HttpRequest = {
      method: 'POST',
      url: `${this.getUrl()}/wp-admin/admin-ajax.php`,
      headers: { 'Content-Type': `${ContentType.URLENCODED}; charset=UTF-8` },
      data: `action=${action}`,
    }

    return await requestHandler.sendRequest(request, true)
  }

  private async searchFallback(query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({ s: query })
    const request: HttpRequest = {
      method: 'GET',
      url: `${this.getUrl()}/?${queryString}`,
      headers: { 'Content-Type': `${ContentType.URLENCODED}; charset=UTF-8` },
    }

    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)
    const mangaList: Manga[] = []

    doc.querySelectorAll('.listupd').forEach((elem) => {
      const titleElem = elem.querySelectorAll('a')[0]
      const url = titleElem?.getAttribute('href')

      const manga = new Manga('', this.siteType)
      manga.title = titleElem?.getAttribute('title')?.trim() || ''

      const image = elem.querySelectorAll('img')[0]
      const imageUrl = image?.getAttribute('src') || ''
      manga.image = imageUrl

      manga.chapter = elem.querySelectorAll('.epxs')[0]?.textContent?.trim() || 'Unknown'
      manga.url = url ?? ''

      if (titleContainsQuery(query, manga.title)) {
        mangaList.push(manga)
      }
    })

    return mangaList
  }

  getTestUrl(): string {
    switch (this.siteType) {
      case SiteType.FlameComics:
        return `${this.getUrl()}/series/the-way-of-the-househusband/`
      case SiteType.LuminousScans:
        return `${this.getUrl()}/series?p=70`
    }

    return this.getUrl()
  }
}
