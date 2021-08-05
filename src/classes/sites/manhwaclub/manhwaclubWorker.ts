import { BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios, { AxiosRequestConfig } from 'axios'
import { Manga } from '../../manga'
import { SiteType } from '../../../enums/siteEnum'
import qs from 'qs'

const COMIC_PREFIX = '/comic/'

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

export class ManhwaClubWorker extends BaseWorker {
  static siteType = SiteType.ManhwaClub
  static url = BaseWorker.getUrl(ManhwaClubWorker.siteType)

  static testUrl = `${ManhwaClubWorker.url}/en/comic/my-uncle`

  comicId?: string
  latestChapter?: ChaptersResponse
  comic?: ComicResponse

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(ManhwaClubWorker.siteType, requestConfig)
  }

  getChapter (): string {
    return this.latestChapter?.name || 'Unknown'
  }

  getChapterUrl (): string {
    if (this.comicId === undefined || this.latestChapter === undefined) return ''
    return `${ManhwaClubWorker.url}/comic/${this.comicId}/${this.latestChapter.slug}/reader`
  }

  getChapterNum (): number {
    return this.parseNum(this.latestChapter?.name.replace(/\D/g, ''))
  }

  getChapterDate (): string {
    const chapterDate = moment(this.latestChapter?.added_at, 'YYYY-MM-DD')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (): string {
    return this.comic?.thumb_url || ''
  }

  getTitle (): string {
    return this.comic?.title || ''
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const comicId = url.substring(url.lastIndexOf(COMIC_PREFIX)).replace(COMIC_PREFIX, '')
    this.comicId = comicId
    const apiUrl = `${ManhwaClubWorker.url}/api/comics/${comicId}`

    const chaptersResponse = await axios.get(`${apiUrl}/chapters`)
    const chapters = chaptersResponse.data as ChaptersResponse[]

    const comicResponse = await axios.get(apiUrl)
    this.comic = comicResponse.data as ComicResponse

    if (chapters !== undefined && chapters.length > 0) {
      this.latestChapter = chapters[0]
    }

    return this.buildManga(url)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      q: query
    })

    const response = await axios.get(`${ManhwaClubWorker.url}/api/comics?${queryString}`)
    const searchResponse = response.data as SearchResponse
    const promises: Promise<Manga | Error>[] = []

    searchResponse.data.forEach((result) => {
      const fullUrl = `${ManhwaClubWorker.url}/comic/${result.slug}`

      if (this.titleContainsQuery(query, result.title)) {
        promises.push(this.readUrl(fullUrl))
      }
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }
}
