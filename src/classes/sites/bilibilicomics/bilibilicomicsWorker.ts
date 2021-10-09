import { BaseData, BaseWorker } from '../baseWorker'
import axios from 'axios'
import { Manga } from '../../manga'
import { SiteType } from '../../../enums/siteEnum'
import qs from 'qs'
import moment from 'moment'

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
  'vertical_cover': string
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

export class BiliBiliComicsWorker extends BaseWorker {
  static siteType = SiteType.BiliBiliComics
  static url = `${BaseWorker.urlPrefix}https://www.${BiliBiliComicsWorker.siteType}`

  static testUrl = `${BiliBiliComicsWorker.url}/detail/mc215`

  constructor () {
    super(BiliBiliComicsWorker.siteType)
  }

  getChapter (data: BiliBiliComicsData): string {
    const chapter = data.mangaData.ep_list[0]
    if (!chapter) return ''

    return `${chapter.ord} ${chapter.title}`
  }

  getChapterUrl (data: BiliBiliComicsData): string {
    const viewerData: BiliBiliComicsQueryData = {
      id: data.mangaData.id,
      chapter: data.mangaData.ep_list[0]?.id
    }

    const queryString = qs.stringify({
      type: BiliBiliComicsWorker.siteType,
      data: JSON.stringify(viewerData)
    })

    return `/mangaviewer?${queryString}`
  }

  getChapterNum (data: BiliBiliComicsData): number {
    return data.mangaData.ep_list[0]?.ord || 0
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

  async readUrl (url: string): Promise<Error | Manga> {
    const comicId = parseInt(url.substring(url.lastIndexOf('/') + 1).replace('mc', ''), 10)
    if (isNaN(comicId)) return Error('Could not get comic from URL')

    const queryString = qs.stringify({
      device: 'pc',
      platform: 'web'
    })

    const response = await axios.post(`${BiliBiliComicsWorker.url}/twirp/comic.v1.Comic/ComicDetail?${queryString}`, {
      comic_id: comicId
    })

    const comicDetailResponse = response.data as ComicDetailResponse
    const data = new BiliBiliComicsData(url, comicDetailResponse.data)

    return Promise.resolve(this.buildManga(data))
  }

  async search (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      device: 'pc',
      platform: 'web'
    })

    const response = await axios.post(`${BiliBiliComicsWorker.url}/twirp/comic.v1.Comic/Search?${queryString}`, {
      style_id: -1,
      area_id: -1,
      is_free: -1,
      key_word: query,
      page_num: 1,
      page_size: 20
    })

    const searchResponse = response.data as SearchResponse
    const promises = searchResponse.data.list.filter((searchEntry) => {
      const title = searchEntry.title.replace(/<em class="keyword">/g, '').replace(/<\/em>/g, '')
      return this.titleContainsQuery(query, title)
    }).map((searchEntry) => {
      return this.readUrl(`${BiliBiliComicsWorker.url}/detail/mc${searchEntry.id}`)
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }
}
