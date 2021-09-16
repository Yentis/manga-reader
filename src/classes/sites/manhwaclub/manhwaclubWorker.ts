import { BaseData, BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios from 'axios'
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

export class ManhwaClubWorker extends BaseWorker {
  static siteType = SiteType.ManhwaClub
  static url = BaseWorker.getUrl(ManhwaClubWorker.siteType)

  static testUrl = `${ManhwaClubWorker.url}/comic/real-man-dogado`

  constructor () {
    super(ManhwaClubWorker.siteType)
  }

  getChapter (data: ManhwaClubData): string {
    return data.latestChapter?.name || 'Unknown'
  }

  getChapterUrl (data: ManhwaClubData): string {
    if (data.latestChapter === undefined) return ''
    return `${ManhwaClubWorker.url}/comic/${data.comicId}/${data.latestChapter.slug}/reader`
  }

  getChapterNum (data: ManhwaClubData): number {
    return this.parseNum(data.latestChapter?.name.replace(/\D/g, ''))
  }

  getChapterDate (data: ManhwaClubData): string {
    const chapterDate = moment(data.latestChapter?.added_at, 'YYYY-MM-DD')
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

  async readUrl (url: string): Promise<Error | Manga> {
    const comicId = url.substring(url.lastIndexOf(COMIC_PREFIX)).replace(COMIC_PREFIX, '')
    const apiUrl = `${ManhwaClubWorker.url}/api/comics/${comicId}`

    const chaptersResponse = await axios.get(`${apiUrl}/chapters`)
    const chapters = chaptersResponse.data as ChaptersResponse[]

    const comicResponse = await axios.get(apiUrl)
    const comic = comicResponse.data as ComicResponse

    let latestChapter: ChaptersResponse | undefined
    if (chapters !== undefined && chapters.length > 0) {
      latestChapter = chapters[0]
    }

    const data = new ManhwaClubData(url, comicId, comic, latestChapter)
    return this.buildManga(data)
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
