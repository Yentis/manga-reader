import PQueue from 'p-queue'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { getDateFromNow, parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import { Manga } from '../manga'
import { BaseData, BaseSite } from './baseSite'

interface Chapter {
  id: number
  name: number
  'created_at': string
}

interface ChapterResponse {
  success: boolean
  message: string | null
  data: {
    data: Chapter[]
  }
}

interface ComicsResponse {
  success: boolean
  message: string | null
  data: {
    comics: {
      id: number
      name: string
      slug: string
      cover: {
        horizontal: string
        thumbnail?: string
      }
    }[]
  }
}

class ZeroScansData extends BaseData {
  chapterData?: Chapter

  constructor (url: string, chapterData?: Chapter) {
    super(url)
    this.chapterData = chapterData
  }
}

export class ZeroScans extends BaseSite {
  siteType = SiteType.ZeroScans

  constructor () {
    super()
    this.requestQueue = new PQueue({ interval: 1000, intervalCap: 1 })
  }

  protected getChapter (data: ZeroScansData): string {
    const chapterNum = data.chapterData?.name
    if (!chapterNum) return 'Unknown'

    return `Chapter ${chapterNum}`
  }

  protected getChapterUrl (data: ZeroScansData): string {
    const chapter = data.chapterData
    if (!chapter) return ''

    return `${data.url}/${chapter.id}`
  }

  protected getChapterNum (data: ZeroScansData): number {
    return data.chapterData?.name || 0
  }

  protected getChapterDate (data: ZeroScansData): string {
    const chapter = data.chapterData
    if (!chapter) return ''

    return getDateFromNow(chapter.created_at)
  }

  protected getImage (data: BaseData): string {
    return data.image?.getAttribute('content') || ''
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const scripts = doc.querySelectorAll('script:not([src]):not([data-hid])')

    let scriptContent: string | null = null
    for (const script of scripts) {
      if (!script.textContent?.trim().startsWith('window.__ZEROSCANS__')) continue
      scriptContent = script.textContent
      break
    }
    if (!scriptContent) return Error(`Failed to parse script for ${url}`)

    const idIndex = scriptContent.indexOf('id') || 0
    const idSubstring = scriptContent.substring(idIndex)
    const idText = idSubstring.substring(0, idSubstring.indexOf(',')).replace('id:', '')
    const id = parseInt(idText)
    if (isNaN(id)) return Error(`Failed to parse ID for ${url}`)

    const chapterRequest: HttpRequest = {
      method: 'GET',
      headers: {
        'sec-gpc': '1'
      },
      url: `${this.getUrl()}/swordflake/comic/${id}/chapters?sort=desc&page=1`
    }
    const chapterResponse = await requestHandler.sendRequest(chapterRequest)
    const chapterData = JSON.parse(chapterResponse.data) as ChapterResponse

    const data = new ZeroScansData(url, chapterData.data.data[0])
    data.image = doc.querySelectorAll('meta[property="og:image"]')[0]
    data.title = doc.querySelectorAll('.v-card__title')[0]

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/swordflake/comics` }
    const response = await requestHandler.sendRequest(request)

    const responseData = JSON.parse(response.data) as ComicsResponse
    const mangaList: Manga[] = []

    for (const comic of responseData.data.comics) {
      const title = comic.name
      if (!titleContainsQuery(query, title)) continue
      const url = `${this.getUrl()}/comics/${comic.slug}`

      const manga = await this.readUrlImpl(url)
      if (manga instanceof Error) continue

      mangaList.push(manga)
    }

    return mangaList
  }

  getTestUrl (): string {
    return `${this.getUrl()}/comics/all-heavenly-days`
  }
}
