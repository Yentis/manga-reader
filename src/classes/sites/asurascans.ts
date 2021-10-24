import { BaseData, BaseSite } from './baseSite'
import { SiteType } from 'src/enums/siteEnum'
import PQueue from 'p-queue'
import moment from 'moment'
import { Manga } from 'src/classes/manga'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { ContentType } from 'src/enums/contentTypeEnum'
import { parseHtmlFromString, parseNum, titleContainsQuery } from '../../utils/siteUtils'

interface AsuraScansSearch {
  series: {
    all: {
      'post_title': string,
      'post_image': string,
      'post_latest': string,
      'post_link': string
    }[]
  }[]
}

class AsuraScansData extends BaseData {
  chapterUrl?: Element
}

export class AsuraScans extends BaseSite {
  siteType: SiteType

  constructor (siteType: SiteType) {
    super()
    this.siteType = siteType

    if (siteType === SiteType.AsuraScans) {
      this.requestQueue = new PQueue({ interval: 2000, intervalCap: 1 })
    }
  }

  getChapterUrl (data: AsuraScansData): string {
    return data.chapterUrl?.getAttribute('href') || ''
  }

  getChapterNum (data: BaseData): number {
    return parseNum(data.chapterNum?.getAttribute('data-num'))
  }

  getChapterDate (data: BaseData): string {
    const chapterDate = moment(data.chapterDate?.textContent, 'MMMM DD, YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (data: BaseData): string {
    return data.image?.getAttribute('content') || ''
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request, true)

    if (response.headers['cf-edge-cache']?.includes('platform=wordpress') !== true) {
      return Error('Found possible DDoS protection, visit the site manually and try again')
    }
    if (response.status >= 400) {
      return Error(`Status Code ${response.status} ${response.statusText}`.trim())
    }

    const doc = await parseHtmlFromString(response.data)
    const chapterItem = doc.querySelectorAll('#chapterlist li')[0]

    const data = new AsuraScansData(url)
    data.chapter = chapterItem?.querySelectorAll('.chapternum')[0]
    data.chapterUrl = chapterItem?.querySelectorAll('a')[0]
    data.chapterNum = chapterItem
    data.chapterDate = chapterItem?.querySelectorAll('.chapterdate')[0]
    data.title = doc.querySelectorAll('.entry-title')[0]

    const imageElements = doc.querySelectorAll('meta[property="og:image"]')
    let image: Element | undefined
    if (imageElements.length === 0) {
      image = doc.querySelectorAll('meta[name="twitter:image"]')[0]
    } else image = imageElements[0]
    data.image = image

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const data = `action=ts_ac_do_search&ts_ac_query=${encodeURIComponent(query)}`
    const request: HttpRequest = {
      method: 'POST',
      url: `${this.getUrl()}/wp-admin/admin-ajax.php`,
      headers: { 'Content-Type': `${ContentType.URLENCODED}; charset=UTF-8` },
      data
    }
    const response = await requestHandler.sendRequest(request, true)

    if (response.headers['cf-edge-cache']?.includes('platform=wordpress') !== true) {
      return Error('Found possible DDoS protection, visit the site manually and try again')
    }
    if (response.status >= 400) {
      return Error(`Status Code ${response.status} ${response.statusText}`.trim())
    }

    const searchData = JSON.parse(response.data) as AsuraScansSearch
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
        manga.url = entryItem.post_link

        mangaList.push(manga)
      }
    }

    return mangaList
  }

  getUrl (): string {
    switch (this.siteType) {
      case SiteType.AsuraScans:
        return `https://www.${this.siteType}`
    }

    return super.getUrl()
  }

  getTestUrl () : string {
    switch (this.siteType) {
      case SiteType.AsuraScans:
        return `${this.getUrl()}/manga/tougen-anki/`
      case SiteType.FlameScans:
        return `${this.getUrl()}/series/you-the-one-and-only-and-the-seven-billion-grim-reapers/`
    }

    return this.getUrl()
  }
}
