import axios, { AxiosRequestConfig } from 'axios'
import { SiteType } from '../../../enums/siteEnum'
import { BaseWorker } from '../baseWorker'
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
      title: {
        en: string
      }
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

export class MangaDexWorker extends BaseWorker {
  static siteType = SiteType.MangaDex
  static url = BaseWorker.getUrl(MangaDexWorker.siteType)
  static testUrl = `${MangaDexWorker.url}/title/1044287a-73df-48d0-b0b2-5327f32dd651`

  private mangaResult?: MangaResult
  private chapterResult?: ChapterResult

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

  getChapter (): string {
    const attributes = this.chapterResult?.data.attributes
    if (!attributes) return 'Unknown'

    const chapter = attributes.chapter
    let chapterText = `Chapter ${chapter}`
    if (attributes.title) {
      chapterText += ` - ${attributes.title}`
    }
    return chapterText
  }

  getChapterUrl (): string {
    const chapterId = this.chapterResult?.data.id
    if (!chapterId) return ''

    return `${MangaDexWorker.url}/chapter/${chapterId}`
  }

  getChapterNum (): number {
    return this.parseNum(this.chapterResult?.data.attributes.chapter)
  }

  getChapterDate (): string {
    const chapterDate = moment.utc(this.chapterResult?.data.attributes.updatedAt)
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (): string {
    const coverFileName = this.mangaResult?.relationships.find((relationship) => {
      return relationship.type === 'cover_art'
    })?.attributes?.fileName
    if (!coverFileName) return ''

    const mangaId = this.mangaResult?.data.id
    if (!mangaId) return ''

    return `https://uploads.${MangaDexWorker.siteType}/covers/${mangaId}/${coverFileName}`
  }

  getTitle (): string {
    return this.mangaResult?.data.attributes.title.en || 'Unknown'
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
    this.chapterResult = chapterData.results[0]

    const mangaQueryString = qs.stringify({
      'includes[]': 'cover_art'
    })

    const mangaResponse = await axios.get(`https://api.${MangaDexWorker.siteType}/manga/${mangaId}?${mangaQueryString}`)
    this.mangaResult = mangaResponse.data as MangaResult

    return this.buildManga(url)
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
      return this.titleContainsQuery(query, result.data.attributes.title.en)
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
