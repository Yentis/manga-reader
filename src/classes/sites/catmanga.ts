import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'

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

export class CatManga extends BaseSite {
  siteType = SiteType.CatManga

  getChapter (data: BaseData): string {
    const textList: string[] = []
    data.chapter?.querySelectorAll('p').forEach((element) => {
      const text = element.textContent?.trim()
      if (!text) return

      textList.push(text)
    })

    if (textList.length === 0) return 'Unknown'
    return textList.join(' - ')
  }

  getChapterUrl (data: BaseData): string {
    const url = data.chapter?.getAttribute('href')
    if (!url) return ''

    return `${this.getUrl()}${url}`
  }

  getChapterNum (data: CatMangaData): number {
    const chapters = data.mangaData.props.pageProps.series.chapters
    return chapters[0]?.number || 0
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

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    const json = doc.querySelectorAll('#__NEXT_DATA__')[0]?.innerHTML
    if (!json) return Error('Could not parse site')

    const data = new CatMangaData(url, JSON.parse(json) as MangaData)
    for (const node of doc.querySelectorAll('a')) {
      if (!node.getAttribute('href')?.includes('series')) continue

      data.chapter = node
      break
    }

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = { method: 'GET', url: this.getUrl() }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    const json = doc.querySelectorAll('#__NEXT_DATA__')[0]?.innerHTML
    if (!json) return Error('Could not parse site')

    const mangaListData = JSON.parse(json) as MangaListData
    const promises = mangaListData.props.pageProps.series
      .filter((seriesItem) => titleContainsQuery(query, seriesItem.title))
      .map((seriesItem) => {
        const url = `${this.getUrl()}/series/${seriesItem.series_id}`
        return this.readUrl(url)
      })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl (): string {
    return `${this.getUrl()}/series/fechi`
  }
}
