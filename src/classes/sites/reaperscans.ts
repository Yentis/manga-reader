import PQueue from 'p-queue'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import * as SiteUtils from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'
import moment from 'moment'
import qs from 'qs'

interface ChapterData {
  // eslint-disable-next-line camelcase
  chapter_name: string
  // eslint-disable-next-line camelcase
  chapter_slug: string
  // eslint-disable-next-line camelcase
  created_at: string
}

interface ChapterResponse {
  data: ChapterData[]
}

interface SearchResponse {
  data: {
    id: number
    title: string
    // eslint-disable-next-line camelcase
    series_slug: string
    thumbnail: string
    // eslint-disable-next-line camelcase
    free_chapters: ChapterData[]
  }[]
  meta: {
    // eslint-disable-next-line camelcase
    next_page_url: string | null
  }
}

class ReaperData extends BaseData {
  chapterData: ChapterResponse

  constructor(url: string, chapterData: ChapterResponse) {
    super(url)
    this.chapterData = chapterData
  }
}

export class ReaperScans extends BaseSite {
  siteType = SiteType.ReaperScans

  constructor() {
    super()
    this.requestQueue = new PQueue({ interval: 1500, intervalCap: 1 })
  }

  protected getChapter(data: ReaperData): string {
    return data.chapterData.data[0]?.chapter_name ?? ''
  }

  protected getChapterNum(data: ReaperData): number {
    const chapter = this.getChapter(data)
    return SiteUtils.matchNum(chapter)
  }

  protected getChapterDate(data: ReaperData): string {
    const createdAt = data.chapterData.data[0]?.created_at
    if (!createdAt) return ''

    const chapterDate = moment(createdAt)
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected getChapterUrl(data: ReaperData): string {
    const slug = data.chapterData.data[0]?.chapter_slug
    if (!slug) return ''

    return `${data.url}/${slug}`
  }

  protected async readUrlImpl(url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    this.trySetUserAgent(request)

    const response = await requestHandler.sendRequest(request)
    const doc = await SiteUtils.parseHtmlFromString(response.data)

    const idIndex = response.data.indexOf('series_id')
    let seriesId = response.data.substring(idIndex)
    const endIndex = seriesId.indexOf(',')
    seriesId = seriesId.substring(0, endIndex).split(':')[1] ?? ''
    if (seriesId.trim() === '') return new Error('ID not found')

    const chapterRequest: HttpRequest = {
      method: 'GET',
      url: `https://api.reaperscans.com/chapter/query?page=1&perPage=30&series_id=${seriesId}`,
    }
    this.trySetUserAgent(chapterRequest)

    const chapterResponse = await requestHandler.sendRequest(chapterRequest)
    const chapterData = JSON.parse(chapterResponse.data) as ChapterResponse

    const data = new ReaperData(url, chapterData)
    data.title = doc.querySelectorAll('section h1')[0]
    data.image = doc?.querySelectorAll('img.w-full')[0]

    return this.buildManga(data)
  }

  protected async searchImpl(query: string): Promise<Error | Manga[]> {
    let page = 1
    let hasMore = true
    const mangaList: Manga[] = []

    while (hasMore) {
      const result = await this.searchPage(query, page)
      hasMore = result.hasMore
      mangaList.push(...result.manga)

      page++
    }

    return mangaList
  }

  private async searchPage(query: string, page: number): Promise<{ manga: Manga[]; hasMore: boolean }> {
    const queryString = qs.stringify({
      adult: true,
      query_string: query,
      page,
    })

    const request: HttpRequest = { method: 'GET', url: `https://api.reaperscans.com/query?${queryString}` }
    this.trySetUserAgent(request)

    const response = await requestHandler.sendRequest(request)
    const searchResponse = JSON.parse(response.data) as SearchResponse
    const mangaList: Manga[] = []

    searchResponse.data.forEach((entry) => {
      const title = entry.title
      if (!SiteUtils.titleContainsQuery(query, title)) return

      const url = `${this.getUrl()}/series/${entry.series_slug}`
      const manga = new Manga(url, this.siteType)

      manga.title = title
      manga.image = `https://media.reaperscans.com/file/4SRBHm/${entry.thumbnail}`
      manga.chapter = entry.free_chapters[0]?.chapter_name ?? ''

      mangaList.push(manga)
    })

    return { manga: mangaList, hasMore: typeof searchResponse.meta.next_page_url === 'string' }
  }

  getTestUrl(): string {
    return `${this.getUrl()}/series/fff-class-trashero`
  }
}
