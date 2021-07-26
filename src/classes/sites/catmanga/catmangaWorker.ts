import { BaseWorker } from '../baseWorker'
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

export class CatMangaWorker extends BaseWorker {
  static siteType = SiteType.CatManga
  static url = BaseWorker.getUrl(CatMangaWorker.siteType)

  static testUrl = `${CatMangaWorker.url}/series/fechi`

  mangaData?: MangaData

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(CatMangaWorker.siteType, requestConfig)
  }

  getChapter (): string {
    const textList: string[] = []
    this.chapter?.find('p').each((_i, element) => {
      const text = cheerio(element).text().trim()
      if (!text) return

      textList.push(text)
    })

    if (textList.length === 0) return 'Unknown'
    return textList.join(' - ')
  }

  getChapterUrl (): string {
    const url = this.chapter?.attr('href')
    if (!url) return ''

    return `${CatMangaWorker.url}${url}`
  }

  getChapterNum (): number {
    const chapters = this.mangaData?.props.pageProps.series.chapters
    if (!chapters) return 0

    return chapters[chapters.length - 1].number
  }

  getChapterDate (): string {
    // Not available
    return ''
  }

  getImage (): string {
    return this.mangaData?.props.pageProps.series.cover_art.source || ''
  }

  getTitle (): string {
    return this.mangaData?.props.pageProps.series.title || ''
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    const json = $('#__NEXT_DATA__').first().html()
    if (!json) return Error('Could not parse site')

    this.mangaData = JSON.parse(json) as MangaData
    this.chapter = $('a>p').first().parent()

    return this.buildManga(url)
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
