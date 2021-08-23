import axios, { AxiosRequestConfig } from 'axios'
import { SiteType } from '../../../enums/siteEnum'
import { BaseData, BaseWorker } from '../baseWorker'
import moment from 'moment'
import { Manga } from '../..//manga'
import relevancy from 'relevancy'
import qs from 'qs'

interface ChapterResult {
  data: {
    id: string,
    attributes: {
      title: string,
      chapter: string,
      updatedAt: string
    }
  }
}

interface ChapterResponse {
  results: ChapterResult[]
}

interface MangaResult {
  data: {
    id: string,
    attributes: {
      title: Record<string, string>
    }
  },
  relationships: {
    type: string,
    attributes?: {
      fileName: string
    }
  }[]
}

interface MangaResponse {
  results: MangaResult[]
}

interface LegacyIdResponse {
  data: {
    attributes: {
      legacyId: number,
      newId: string
    }
  }
}

class MangaDexData extends BaseData {
  url: string

  chapterResult: ChapterResult

  mangaResult: MangaResult

  constructor (url: string, chapterResult: ChapterResult, mangaResult: MangaResult) {
    super(url)

    this.url = url
    this.chapterResult = chapterResult
    this.mangaResult = mangaResult
  }
}

export class MangaDexWorker extends BaseWorker {
  static siteType = SiteType.MangaDex
  static url = BaseWorker.getUrl(MangaDexWorker.siteType)
  static testUrl = `${MangaDexWorker.url}/title/1044287a-73df-48d0-b0b2-5327f32dd651`

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(MangaDexWorker.siteType, requestConfig)
  }

  async syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    if (chapterNum === 0) {
      return
    }

    const data = new FormData()
    data.append('volume', '0')
    data.append('chapter', chapterNum.toString())

    const response = await axios({
      method: 'post',
      url: `${MangaDexWorker.url}/ajax/actions.ajax.php?function=edit_progress&id=${mangaId}`,
      headers: {
        'x-requested-with': 'XMLHttpRequest'
      },
      data
    })

    if (response.data !== '') {
      return Error(response.data)
    }
  }

  getChapter (data: MangaDexData): string {
    const attributes = data.chapterResult.data.attributes
    if (!attributes) return 'Unknown'

    const chapter = attributes.chapter
    let chapterText = `Chapter ${chapter}`
    if (attributes.title) {
      chapterText += ` - ${attributes.title}`
    }
    return chapterText
  }

  getChapterUrl (data: MangaDexData): string {
    const chapterId = data.chapterResult.data.id
    if (!chapterId) return ''

    return `${MangaDexWorker.url}/chapter/${chapterId}`
  }

  getChapterNum (data: MangaDexData): number {
    return this.parseNum(data.chapterResult.data.attributes.chapter)
  }

  getChapterDate (data: MangaDexData): string {
    const chapterDate = moment.utc(data.chapterResult.data.attributes.updatedAt)
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (data: MangaDexData): string {
    const coverFileName = data.mangaResult.relationships.find((relationship) => {
      return relationship.type === 'cover_art'
    })?.attributes?.fileName
    if (!coverFileName) return ''

    const mangaId = data.mangaResult.data.id
    if (!mangaId) return ''

    return `https://uploads.${MangaDexWorker.siteType}/covers/${mangaId}/${coverFileName}`
  }

  getTitle (data: MangaDexData): string {
    return this.getTitleFromAttributes(data.mangaResult.data.attributes)
  }

  private getTitleFromAttributes (attributes: MangaResult['data']['attributes']) {
    const titleObj = attributes?.title
    if (!titleObj) return ''

    // Use the first title we find
    return Object.values(titleObj).find(() => true) || ''
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const mangaId = url.replace(`${MangaDexWorker.url}/title/`, '')
    const chapterQueryString = qs.stringify({
      manga: mangaId,
      'order[chapter]': 'desc',
      limit: 1,
      'translatedLanguage[]': 'en'
    })

    const chapterResponse = await axios.get(`https://api.${MangaDexWorker.siteType}/chapter?${chapterQueryString}`)
    const chapterData = chapterResponse.data as ChapterResponse
    const chapterResult = chapterData.results[0]

    const mangaQueryString = qs.stringify({
      'includes[]': 'cover_art'
    })

    const mangaResponse = await axios.get(`https://api.${MangaDexWorker.siteType}/manga/${mangaId}?${mangaQueryString}`)
    const mangaResult = mangaResponse.data as MangaResult

    return this.buildManga(new MangaDexData(url, chapterResult, mangaResult))
  }

  static async convertLegacyIds (ids: number[]): Promise<Record<number, string>> {
    const response = await axios.post(`https://api.${MangaDexWorker.siteType}/legacy/mapping`, {
      type: 'manga',
      ids
    })
    const data = response.data as LegacyIdResponse[]
    const legacyIdMap: Record<number, string> = {}

    data.forEach((item) => {
      const attributes = item.data.attributes
      legacyIdMap[attributes.legacyId] = attributes.newId
    })

    return legacyIdMap
  }

  async search (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      title: query
    })
    const response = await axios.get(`https://api.${MangaDexWorker.siteType}/manga?${queryString}`)
    const mangaData = response.data as MangaResponse
    const promises: Promise<Error | Manga>[] = []

    let candidateUrls = mangaData.results.filter((result) => {
      const title = this.getTitleFromAttributes(result.data.attributes)
      return this.titleContainsQuery(query, title)
    }).map((result) => {
      return `${MangaDexWorker.url}/title/${result.data.id}`
    })
    candidateUrls = relevancy.sort(candidateUrls, query)

    for (let i = 0; i < Math.min(5, candidateUrls.length); i++) {
      promises.push(this.readUrl(candidateUrls[i]))
    }

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }
}
