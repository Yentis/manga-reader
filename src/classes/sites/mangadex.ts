import { BaseData, BaseSite } from './baseSite'
import PQueue from 'p-queue'
import { QVueGlobals } from 'quasar/dist/types'
import { Store } from 'vuex'
import { SiteType } from 'src/enums/siteEnum'
import moment from 'moment'
import { Manga } from '../manga'
import qs from 'qs'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import BaseRequest from '../requests/baseRequest'
import { ContentType } from 'src/enums/contentTypeEnum'
import relevancy from 'relevancy'
import { parseNum, titleContainsQuery } from 'src/utils/siteUtils'

interface ChapterResult {
  id: string,
  attributes: {
    title: string,
    volume: string,
    chapter: string,
    updatedAt: string
  }
}

interface ChapterResponse {
  data: ChapterResult[]
}

interface MangaResult {
  id: string,
  attributes: {
    title: Record<string, string>
  },
  relationships: {
    type: string,
    attributes?: {
      fileName: string
    }
  }[]
}

interface MangaResponse {
  data: MangaResult
}

interface SearchResponse {
  data: MangaResult[]
}

interface LegacyIdResponse {
  data: {
    attributes: {
      legacyId: number,
      newId: string
    }
  }[]
}

class MangaDexData extends BaseData {
  url: string

  chapterResult?: ChapterResult

  mangaResult: MangaResult

  constructor (url: string, chapterResult: ChapterResult | undefined, mangaResult: MangaResult) {
    super(url)

    this.url = url
    this.chapterResult = chapterResult
    this.mangaResult = mangaResult
  }
}

export class MangaDex extends BaseSite {
  static siteType = SiteType.MangaDex
  siteType = MangaDex.siteType
  requestQueue = new PQueue({ interval: 1000, intervalCap: 5 })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  syncReadChapter (_mangaId: number, _chapterNum: number): Promise<void | Error> {
    return Promise.resolve(Error('MangaDex syncing is currently not functional'))
  }

  getChapter (data: MangaDexData): string {
    const attributes = data.chapterResult?.attributes
    if (!attributes) return 'Unknown'

    const chapter = attributes.chapter
    let chapterText = `Chapter ${chapter}`

    if (attributes.title) {
      chapterText += ` - ${attributes.title}`
    }

    if (attributes.volume) {
      chapterText = `Volume ${attributes.volume} - ${chapterText}`
    }

    return chapterText
  }

  getChapterUrl (data: MangaDexData): string {
    const chapterId = data.chapterResult?.id
    if (!chapterId) return ''

    return `${this.getUrl()}/chapter/${chapterId}`
  }

  getChapterNum (data: MangaDexData): number {
    return parseNum(data.chapterResult?.attributes.chapter)
  }

  getChapterDate (data: MangaDexData): string {
    const updatedAt = data.chapterResult?.attributes.updatedAt
    if (!updatedAt) return ''

    const chapterDate = moment.utc(updatedAt)
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (data: MangaDexData): string {
    const coverFileName = data.mangaResult.relationships?.find((relationship) => {
      return relationship.type === 'cover_art'
    })?.attributes?.fileName
    if (!coverFileName) return ''

    const mangaId = data.mangaResult.id
    if (!mangaId) return ''

    return `https://uploads.${this.siteType}/covers/${mangaId}/${coverFileName}`
  }

  getTitle (data: MangaDexData): string {
    return this.getTitleFromAttributes(data.mangaResult.attributes)
  }

  private getTitleFromAttributes (attributes: MangaResult['attributes']) {
    const titleObj = attributes?.title
    if (!titleObj) return ''

    // Use the first title we find
    return Object.values(titleObj).find(() => true) || ''
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const mangaId = url.replace(`${this.getUrl()}/title/`, '').split('/')[0]
    if (!mangaId) return Error('Manga ID not found')

    const chapterQueryString = qs.stringify({
      manga: mangaId,
      'order[volume]': 'desc',
      'order[chapter]': 'desc',
      limit: 1,
      'translatedLanguage[]': 'en'
    })

    const chapterRequest: HttpRequest = { method: 'GET', url: `https://api.${this.siteType}/chapter?${chapterQueryString}` }
    const chapterResponse = await requestHandler.sendRequest(chapterRequest)
    const chapterData = JSON.parse(chapterResponse.data) as ChapterResponse
    const chapterResult = chapterData.data[0]

    const mangaQueryString = qs.stringify({
      'includes[]': 'cover_art'
    })

    const mangaRequest: HttpRequest = { method: 'GET', url: `https://api.${this.siteType}/manga/${mangaId}?${mangaQueryString}` }
    const mangaResponse = await requestHandler.sendRequest(mangaRequest)
    const mangaResult = (JSON.parse(mangaResponse.data) as MangaResponse).data

    return this.buildManga(new MangaDexData(url, chapterResult, mangaResult))
  }

  static async convertLegacyIds (ids: number[], requestHandler: BaseRequest): Promise<Record<number, string>> {
    const response = await requestHandler.sendRequest({
      method: 'POST',
      url: `https://api.${MangaDex.siteType}/legacy/mapping`,
      data: `{"type": "manga", "ids": [${ids.join(',')}]}`,
      headers: { 'Content-Type': ContentType.JSON }
    })
    const legacyIdResponse = JSON.parse(response.data) as LegacyIdResponse
    const legacyIdMap: Record<number, string> = {}

    legacyIdResponse.data.forEach((item) => {
      const attributes = item.attributes
      legacyIdMap[attributes.legacyId] = attributes.newId
    })

    return legacyIdMap
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      title: query
    })
    const request: HttpRequest = { method: 'GET', url: `https://api.${this.siteType}/manga?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const mangaData = JSON.parse(response.data) as SearchResponse
    const promises: Promise<Error | Manga>[] = []

    let candidateUrls = mangaData.data.filter((result) => {
      const title = this.getTitleFromAttributes(result.attributes)
      return titleContainsQuery(query, title)
    }).map((result) => {
      return `${this.getUrl()}/title/${result.id}`
    })

    // 5 most relevant results
    candidateUrls = relevancy.sort(candidateUrls, query).slice(0, 5)
    candidateUrls.forEach((url) => {
      promises.push(this.readUrl(url))
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getMangaId ($q: QVueGlobals, store: Store<unknown>, url: string): Promise<number | Error> {
    const matches = /\/title\/(\d*)/gm.exec(url) || []
    let mangaId = -1

    for (const match of matches) {
      const parsedMatch = parseInt(match)
      if (!isNaN(parsedMatch)) mangaId = parsedMatch
    }

    return Promise.resolve(mangaId)
  }

  static getUrl (): string {
    return BaseSite.getUrl(MangaDex.siteType)
  }

  getUrl (): string {
    return MangaDex.getUrl()
  }

  getTestUrl (): string {
    return `${this.getUrl()}/title/1044287a-73df-48d0-b0b2-5327f32dd651/jojo-s-bizarre-adventure-part-7-steel-ball-run-official-colored`
  }
}
