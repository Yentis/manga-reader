import { BaseData, BaseWorker } from '../baseWorker'
import axios, { AxiosRequestConfig } from 'axios'
import { Manga } from '../../manga'
import cheerio from 'cheerio'
import { SiteType } from '../../../enums/siteEnum'

interface SeriesItem {
  title: string,
  'cover_art': {
    source: string
  },
  'series_id': string,
  chapters: {
    number: number
  }[]
}

interface MangaData {
  props: {
    pageProps: {
      series: SeriesItem
    }
  }
}

interface MangaListData {
  props: {
    pageProps: {
      series: SeriesItem[]
    }
  }
}

class CatMangaData extends BaseData {
  mangaData: MangaData

  constructor (url: string, mangaData: MangaData) {
    super(url)

    this.mangaData = mangaData
  }
}

export class CatMangaWorker extends BaseWorker {
  static siteType = SiteType.CatManga
  static url = BaseWorker.getUrl(CatMangaWorker.siteType)

  static testUrl = `${CatMangaWorker.url}/series/fechi`

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(CatMangaWorker.siteType, requestConfig)
  }

  getChapter (data: BaseData): string {
    const textList: string[] = []
    data.chapter?.find('p').each((_i, element) => {
      const text = cheerio(element).text().trim()
      if (!text) return

      textList.push(text)
    })

    if (textList.length === 0) return 'Unknown'
    return textList.join(' - ')
  }

  getChapterUrl (data: BaseData): string {
    const url = data.chapter?.attr('href')
    if (!url) return ''

    return `${CatMangaWorker.url}${url}`
  }

  getChapterNum (data: CatMangaData): number {
    const chapters = data.mangaData.props.pageProps.series.chapters
    return chapters[chapters.length - 1].number
  }

  getChapterDate (): string {
    // Not available
    return ''
  }

  getImage (data: CatMangaData): string {
    return data.mangaData.props.pageProps.series.cover_art.source
  }

  getTitle (data: CatMangaData): string {
    return data.mangaData.props.pageProps.series.title
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    const json = $('#__NEXT_DATA__').first().html()
    if (!json) return Error('Could not parse site')

    const data = new CatMangaData(url, JSON.parse(json) as MangaData)
    data.chapter = $('a>p').first().parent()

    return this.buildManga(data)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const response = await axios.get(CatMangaWorker.url)
    const $ = cheerio.load(response.data)

    const json = $('#__NEXT_DATA__').first().html()
    if (!json) return Error('Could not parse site')

    const mangaListData = JSON.parse(json) as MangaListData

    return mangaListData.props.pageProps.series
      .filter((seriesItem) => this.titleContainsQuery(query, seriesItem.title))
      .map((seriesItem) => {
        const manga = new Manga('', this.siteType)
        manga.title = seriesItem.title
        manga.image = seriesItem.cover_art.source
        manga.url = `${CatMangaWorker.url}/series/${seriesItem.series_id}`

        if (seriesItem.chapters.length > 0) {
          manga.chapter = `Chapter ${seriesItem.chapters[seriesItem.chapters.length - 1].number}`
        }

        return manga
      })
  }
}
