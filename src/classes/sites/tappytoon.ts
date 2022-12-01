import moment from 'moment'
import qs from 'qs'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest, { Method } from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'

interface RequestResponse {
  request: {
    url: string,
    params: Record<string, unknown>,
    method: string
  }
}

interface NextData {
  props: {
    initialState: {
      axios: {
        baseURL: string,
        headers: Record<string, string>,
        params: Record<string, unknown>
      },
      apis: Record<string, RequestResponse>
    }
  }
}

interface ComicData {
  id: number,
  slug: string,
  title: string,
  posterThumbnailUrl: string
}

interface ChapterData {
  id: number,
  title: string,
  order: number,
  createdAt: string
}

class TappyToonData extends BaseData {
  comicData: ComicData
  chapterDataList: ChapterData[]

  constructor (url: string, comicData: ComicData, chapterDataList: ChapterData[]) {
    super(url)
    this.comicData = comicData
    this.chapterDataList = chapterDataList
  }
}

export class TappyToon extends BaseSite {
  siteType = SiteType.Tappytoon
  apiUrl = `https://api-global.${this.siteType}`

  protected getChapter (data: TappyToonData): string {
    return data.chapterDataList[0]?.title ?? 'Unknown'
  }

  protected getChapterUrl (data: TappyToonData): string {
    const chapter = data.chapterDataList[0]
    if (!chapter) return ''

    return `${this.getUrl()}/en/chapters/${chapter.id}`
  }

  protected getChapterNum (data: TappyToonData): number {
    return data.chapterDataList[0]?.order ?? 0
  }

  protected getChapterDate (data: TappyToonData): string {
    const chapterDate = moment(data.chapterDataList[0]?.createdAt)
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected getImage (data: TappyToonData): string {
    return data.comicData.posterThumbnailUrl
  }

  protected getTitle (data: TappyToonData): string {
    return data.comicData.title
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const nextDataText = doc.getElementById('__NEXT_DATA__')?.textContent
    if (!nextDataText) return new Error('Failed to get data')

    const nextData = JSON.parse(nextDataText) as NextData
    const headers = nextData.props.initialState.axios.headers

    const comicRequestData = Object.values(nextData.props.initialState.apis).find((api) => {
      return !api.request.url.endsWith('chapters') && api.request.url.startsWith('/comics/')
    })
    if (!comicRequestData) return new Error('Failed to get comic data')

    const comicQueryString = qs.stringify({ locale: 'en' })
    const comicRequest: HttpRequest = {
      method: comicRequestData.request.method.toUpperCase() as Method,
      url: `${this.apiUrl}${comicRequestData.request.url}?${comicQueryString}`,
      headers
    }

    const comicResponse = await requestHandler.sendRequest(comicRequest)
    const comicData = JSON.parse(comicResponse.data) as ComicData

    const chapterDataList = await this.getChapterDataList(nextData, headers)
    if (chapterDataList instanceof Error) return chapterDataList

    const data = new TappyToonData(url, comicData, chapterDataList)
    return this.buildManga(data)
  }

  private async getChapterDataList (nextData: NextData, headers: Record<string, string>): Promise<ChapterData[] | Error> {
    const requestData = Object.values(nextData.props.initialState.apis).find((api) => {
      return api.request.url.endsWith('/chapters')
    })
    if (!requestData) return new Error('Failed to get chapter data')

    const request: HttpRequest = {
      method: requestData.request.method.toUpperCase() as Method,
      url: `${this.apiUrl}${requestData.request.url}?${this.getChapterDataListQueryString()}`,
      headers
    }

    const response = await requestHandler.sendRequest(request)
    return JSON.parse(response.data) as ChapterData[]
  }

  private async getChapterDataListById (id: number, headers: Record<string, string>): Promise<ChapterData[] | Error> {
    const request: HttpRequest = {
      method: 'GET',
      url: `${this.apiUrl}/comics/${id}/chapters?${this.getChapterDataListQueryString()}`,
      headers
    }

    const response = await requestHandler.sendRequest(request)
    return JSON.parse(response.data) as ChapterData[]
  }

  private getChapterDataListQueryString (): string {
    return qs.stringify({
      sort: 'desc',
      limit: 1,
      locale: 'en'
    })
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/en/search/comics` }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const nextDataText = doc.getElementById('__NEXT_DATA__')?.textContent
    if (!nextDataText) return new Error('Failed to get data')

    const nextData = JSON.parse(nextDataText) as NextData
    const headers = nextData.props.initialState.axios.headers

    const queryString = qs.stringify({ keyword: query, locale: 'en' })
    const searchRequest: HttpRequest = {
      method: 'GET',
      url: `${this.apiUrl}/comics?${queryString}`,
      headers
    }

    const searchResponse = await requestHandler.sendRequest(searchRequest)
    const searchData = JSON.parse(searchResponse.data) as ComicData[]

    const promises: Promise<Manga | Error>[] = []

    searchData.forEach((entry) => {
      if (!titleContainsQuery(query, entry.title)) return
      const url = `${this.getUrl()}/en/book/${entry.slug}`

      promises.push(new Promise((resolve) => {
        this.getChapterDataListById(entry.id, headers).then((chapterDataList) => {
          if (chapterDataList instanceof Error) {
            resolve(chapterDataList)
            return
          }

          const data = new TappyToonData(url, entry, chapterDataList)
          const manga = new Manga(url, this.siteType)

          manga.title = this.getTitle(data)
          manga.image = this.getImage(data)
          manga.chapter = this.getChapter(data)

          resolve(manga)
        }).catch(resolve)
      }))
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl (): string {
    return `${this.getUrl()}/en/book/return-survival`
  }

  getUrl (): string {
    return `https://www.${this.siteType}`
  }
}
