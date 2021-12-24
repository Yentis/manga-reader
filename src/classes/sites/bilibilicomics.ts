import moment from 'moment'
import qs from 'qs'
import { Manga } from 'src/classes/manga'
import { ContentType } from 'src/enums/contentTypeEnum'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'

interface ChapterData {
  id: number,
  cover: string,
  ord: number,
  title: string,
  'pub_time': string
}

interface MangaData {
  id: number,
  title: string,
  'ep_list': ChapterData[],
  'vertical_cover': string,
  'only_app_amount': number
}

export interface ComicDetailResponse {
  data: MangaData
}

interface SearchResponse {
  data: {
    list: {
      id: number,
      title: string
    }[]
  }
}

export interface BiliBiliComicsQueryData {
  id?: number
  chapter?: number
}

class BiliBiliComicsData extends BaseData {
  mangaData: MangaData

  constructor (url: string, mangaData: MangaData) {
    super(url)
    this.mangaData = mangaData
  }
}

export class BiliBiliComics extends BaseSite {
  private static siteType = SiteType.BiliBiliComics
  siteType = BiliBiliComics.siteType

  getChapter (data: BiliBiliComicsData): string {
    const chapter = this.getLatestWebChapter(data)
    if (!chapter) return ''

    return `${chapter.ord} ${chapter.title}`
  }

  getChapterUrl (data: BiliBiliComicsData): string {
    const chapterId = this.getLatestWebChapter(data)?.id
    if (!chapterId) return ''

    return `${this.getUrl()}/mc${data.mangaData.id}/${chapterId}`
  }

  private getLatestWebChapter (data: BiliBiliComicsData): ChapterData | undefined {
    const chapters = data.mangaData.ep_list
    const appOnlyAmount = data.mangaData.only_app_amount
    return chapters[appOnlyAmount]
  }

  getChapterNum (data: BiliBiliComicsData): number {
    const chapter = this.getLatestWebChapter(data)
    return chapter?.ord || 0
  }

  getChapterDate (data: BiliBiliComicsData): string {
    const chapterDate = moment(data.mangaData.ep_list[0]?.pub_time)
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (data: BiliBiliComicsData): string {
    return `${data.mangaData.vertical_cover}@300w.webp`
  }

  getTitle (data: BiliBiliComicsData): string {
    return data.mangaData.title
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const comicId = parseInt(url.substring(url.lastIndexOf('/') + 1).replace('mc', ''), 10)
    if (isNaN(comicId)) return Error('Could not get comic from URL')

    const queryString = qs.stringify({
      device: 'pc',
      platform: 'web'
    })

    const request: HttpRequest = {
      method: 'POST',
      url: `${this.getUrl()}/twirp/comic.v1.Comic/ComicDetail?${queryString}`,
      data: JSON.stringify({ comic_id: comicId }),
      headers: { 'Content-Type': ContentType.JSON }
    }
    const response = await requestHandler.sendRequest(request)

    const comicDetailResponse = JSON.parse(response.data) as ComicDetailResponse
    const data = new BiliBiliComicsData(url, comicDetailResponse.data)

    return Promise.resolve(this.buildManga(data))
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      device: 'pc',
      platform: 'web'
    })

    const data = {
      style_id: -1,
      area_id: -1,
      is_free: -1,
      key_word: query,
      page_num: 1,
      page_size: 20
    }

    const request: HttpRequest = {
      method: 'POST',
      url: `${this.getUrl()}/twirp/comic.v1.Comic/Search?${queryString}`,
      data: JSON.stringify(data),
      headers: { 'Content-Type': ContentType.JSON }
    }
    const response = await requestHandler.sendRequest(request)

    const searchResponse = JSON.parse(response.data) as SearchResponse
    const promises = searchResponse.data.list.filter((searchEntry) => {
      const title = searchEntry.title.replace(/<em class="keyword">/g, '').replace(/<\/em>/g, '')
      return titleContainsQuery(query, title)
    }).map((searchEntry) => {
      return this.readUrl(`${this.getUrl()}/detail/mc${searchEntry.id}`)
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  static getUrl (): string {
    return `https://www.${BiliBiliComics.siteType}`
  }

  getUrl (): string {
    return BiliBiliComics.getUrl()
  }

  getTestUrl (): string {
    return `${this.getUrl()}/detail/mc215`
  }
}
