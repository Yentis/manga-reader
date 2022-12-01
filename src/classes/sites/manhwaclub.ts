import moment from 'moment'
import PQueue from 'p-queue'
import qs from 'qs'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { getDateFromNow, matchNum, titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'

interface ChaptersResponse {
  'added_at': string,
  name: string,
  slug: string
}

interface ComicResponse {
  'thumb_url': string,
  title: string,
  slug: string,
  'chapters_count': number
}

interface SearchResponse {
  data: ComicResponse[]
}

class ManhwaClubData extends BaseData {
  comicId: string
  comic: ComicResponse
  latestChapter?: ChaptersResponse

  constructor (url: string, comicId: string, comic: ComicResponse, latestChapter?: ChaptersResponse) {
    super(url)

    this.comicId = comicId
    this.comic = comic
    this.latestChapter = latestChapter
  }
}

export class ManhwaClub extends BaseSite {
  private comicPrefix = '/comic/'
  siteType = SiteType.ManhwaClub

  constructor () {
    super()
    this.requestQueue = new PQueue({ interval: 500, intervalCap: 1 })
  }

  getChapter (data: ManhwaClubData): string {
    return data.latestChapter?.name || 'Unknown'
  }

  getChapterUrl (data: ManhwaClubData): string {
    if (data.latestChapter === undefined) return ''
    return `${this.getUrl()}/comic/${data.comicId}/${data.latestChapter.slug}/reader`
  }

  getChapterNum (data: ManhwaClubData): number {
    return matchNum(data.latestChapter?.name)
  }

  getChapterDate (data: ManhwaClubData): string {
    const addedAt = data.latestChapter?.added_at
    if (!addedAt) return ''

    if (addedAt.endsWith('ago')) {
      return getDateFromNow(addedAt)
    }

    const chapterDate = moment(addedAt, 'YYYY-MM-DD')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (data: ManhwaClubData): string {
    return data.comic.thumb_url
  }

  getTitle (data: ManhwaClubData): string {
    return data.comic.title
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const comicId = url.substring(url.lastIndexOf(this.comicPrefix)).replace(this.comicPrefix, '')
    const apiUrl = `${this.getUrl()}/api/comics/${comicId}`

    const chaptersRequest: HttpRequest = { method: 'GET', url: `${apiUrl}/chapters` }
    const chaptersResponse = await requestHandler.sendRequest(chaptersRequest)
    const chapters = JSON.parse(chaptersResponse.data) as ChaptersResponse[]

    const comicRequest: HttpRequest = { method: 'GET', url: apiUrl }
    const comicResponse = await requestHandler.sendRequest(comicRequest)
    const comic = JSON.parse(comicResponse.data) as ComicResponse

    let latestChapter: ChaptersResponse | undefined
    if (chapters !== undefined && chapters.length > 0) {
      latestChapter = chapters[0]
    }

    const data = new ManhwaClubData(url, comicId, comic, latestChapter)
    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      q: query
    })

    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/api/comics?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const searchResponse = JSON.parse(response.data) as SearchResponse
    const promises: Promise<Manga | Error>[] = []

    searchResponse.data.forEach((result) => {
      const fullUrl = `${this.getUrl()}/comic/${result.slug}`

      if (titleContainsQuery(query, result.title)) {
        promises.push(this.readUrl(fullUrl))
      }
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl (): string {
    return `${this.getUrl()}/comic/movies-are-real`
  }
}
