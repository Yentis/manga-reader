import { BaseData, BaseSite } from './baseSite'
import PQueue from 'p-queue'
import type { QVueGlobals } from 'quasar'
import { SiteType } from 'src/enums/siteEnum'
import moment from 'moment'
import { Manga } from '../manga'
import qs from 'qs'
import type { HttpRequest } from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import type BaseRequest from '../requests/baseRequest'
import { ContentType } from 'src/enums/contentTypeEnum'
import relevancy from 'relevancy'
import { parseNum, titleContainsQuery } from 'src/utils/siteUtils'

interface ChapterResult {
  id: string
  attributes: {
    title?: string
    volume?: string
    chapter?: string
    updatedAt: string
  }
}

interface ChapterResponse {
  data: ChapterResult[]
}

interface MangaResult {
  id: string
  attributes: {
    title: Record<string, string>
    altTitles: Record<string, string>[]
  }
  relationships: {
    type: string
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
      legacyId: number
      newId: string
    }
  }[]
}

class MangaDexData extends BaseData {
  override url: string

  chapterResult?: ChapterResult

  mangaResult: MangaResult

  constructor(url: string, chapterResult: ChapterResult | undefined, mangaResult: MangaResult) {
    super(url)

    this.url = url
    this.chapterResult = chapterResult
    this.mangaResult = mangaResult
  }
}

export class MangaDex extends BaseSite {
  siteType = SiteType.MangaDex
  override requestQueue = new PQueue({ interval: 1000, intervalCap: 5 })

  static override getUrl(): string {
    return BaseSite.getUrl(SiteType.MangaDex)
  }

  static async convertLegacyIds(ids: number[], targetRequestHandler: BaseRequest): Promise<Record<number, string>> {
    const response = await targetRequestHandler.sendRequest({
      method: 'POST',
      url: `https://api.${SiteType.MangaDex}/legacy/mapping`,
      data: `{"type": "manga", "ids": [${ids.join(',')}]}`,
      headers: { 'Content-Type': ContentType.JSON },
    })
    const legacyIdResponse = JSON.parse(response.data) as LegacyIdResponse
    const legacyIdMap: Record<number, string> = {}

    legacyIdResponse.data.forEach((item) => {
      const attributes = item.attributes
      legacyIdMap[attributes.legacyId] = attributes.newId
    })

    return legacyIdMap
  }

  protected override getChapter(data: MangaDexData): string {
    const attributes = data.chapterResult?.attributes
    if (!attributes) return 'Unknown'

    const chapter = attributes.chapter
    let chapterText = chapter ? `Chapter ${chapter}` : ''

    if (attributes.title) {
      if (chapterText.length === 0) {
        chapterText = attributes.title
      } else {
        chapterText += ` - ${attributes.title}`
      }
    }

    if (attributes.volume) {
      if (chapterText.length === 0) {
        chapterText = `Volume ${attributes.volume}`
      } else {
        chapterText = `Volume ${attributes.volume} - ${chapterText}`
      }
    }

    return chapterText
  }

  protected override getChapterUrl(data: MangaDexData): string {
    const chapterId = data.chapterResult?.id
    if (!chapterId) return ''

    return `${this.getUrl()}/chapter/${chapterId}`
  }

  protected override getChapterNum(data: MangaDexData): number {
    return parseNum(data.chapterResult?.attributes.chapter)
  }

  protected override getChapterDate(data: MangaDexData): string {
    const updatedAt = data.chapterResult?.attributes.updatedAt
    if (!updatedAt) return ''

    const chapterDate = moment.utc(updatedAt)
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected override getImage(data: MangaDexData): string {
    const coverFileName = data.mangaResult.relationships?.find((relationship) => {
      return relationship.type === 'cover_art'
    })?.attributes?.fileName
    if (!coverFileName) return ''

    const mangaId = data.mangaResult.id
    if (!mangaId) return ''

    return `https://uploads.${this.siteType}/covers/${mangaId}/${coverFileName}`
  }

  public override async readImage(url: string): Promise<string> {
    const request: HttpRequest = {
      method: 'GET',
      url,
      headers: {
        responseType: 'arraybuffer',
      },
    }
    const response = await requestHandler.sendRequest(request)

    return `data:image/jpg;base64,${response.data}`
  }

  protected override getTitle(data: MangaDexData): string {
    // Use the first title we find
    return this.getTitlesFromAttributes(data.mangaResult.attributes)[0] ?? ''
  }

  private getTitlesFromAttributes(attributes: MangaResult['attributes']): string[] {
    const titleObj = attributes?.title ?? []
    const altTitles = attributes.altTitles
      .map((entry) => {
        return Object.values(entry)
      })
      .flat()
      .filter((title): title is string => {
        return (title ?? '').trim() !== ''
      })

    return [...Object.values(titleObj), ...altTitles]
  }

  protected async readUrlImpl(url: string): Promise<Error | Manga> {
    const mangaId = url.replace(`${this.getUrl()}/title/`, '').split('/')[0]
    if (!mangaId) return Error('Manga ID not found')

    const chapterQueryString = qs.stringify({
      manga: mangaId,
      'order[volume]': 'desc',
      'order[chapter]': 'desc',
      limit: 1,
      'translatedLanguage[]': 'en',
    })

    const chapterRequest: HttpRequest = {
      method: 'GET',
      url: `https://api.${this.siteType}/chapter?${chapterQueryString}`,
    }
    const chapterResponse = await requestHandler.sendRequest(chapterRequest)
    const chapterData = JSON.parse(chapterResponse.data) as ChapterResponse

    const chapterResult = chapterData.data[0]
    if (!chapterResult) return new Error('No chapters found')

    const mangaQueryString = qs.stringify({
      'includes[]': 'cover_art',
    })

    const mangaRequest: HttpRequest = {
      method: 'GET',
      url: `https://api.${this.siteType}/manga/${mangaId}?${mangaQueryString}`,
    }
    const mangaResponse = await requestHandler.sendRequest(mangaRequest)
    const mangaResult = (JSON.parse(mangaResponse.data) as MangaResponse).data

    return this.buildManga(new MangaDexData(url, chapterResult, mangaResult))
  }

  protected async searchImpl(query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      title: query,
    })

    const request: HttpRequest = { method: 'GET', url: `https://api.${this.siteType}/manga?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const mangaData = JSON.parse(response.data) as SearchResponse
    const promises: Promise<Error | Manga>[] = []

    let candidateUrls = mangaData.data
      .filter((result) => {
        const titles = this.getTitlesFromAttributes(result.attributes)
        return titles.some((title) => titleContainsQuery(query, title))
      })
      .map((result) => {
        return `${this.getUrl()}/title/${result.id}`
      })

    // 5 most relevant results
    candidateUrls = relevancy.sort(candidateUrls, query).slice(0, 5)
    candidateUrls.forEach((url) => {
      promises.push(this.readUrl(url))
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter((manga) => manga instanceof Manga)
  }

  override getMangaId(_$q: QVueGlobals, url: string): Promise<number | Error> {
    const matches = /\/title\/(\d*)/gm.exec(url) ?? []
    let mangaId = -1

    for (const match of matches) {
      const parsedMatch = parseInt(match)
      if (!isNaN(parsedMatch)) mangaId = parsedMatch
    }

    return Promise.resolve(mangaId)
  }

  override getUrl(): string {
    return MangaDex.getUrl()
  }

  getTestUrl(): string {
    return `${this.getUrl()}/title/1044287a-73df-48d0-b0b2-5327f32dd651/jojo-s-bizarre-adventure-part-7-steel-ball-run-official-colored`
  }
}
