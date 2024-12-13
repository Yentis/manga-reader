import { BaseData, BaseSite } from './baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { Manga } from 'src/classes/manga'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import * as SiteUtils from 'src/utils/siteUtils'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import moment from 'moment'

interface Series {
  series_id: number
  title: string
  cover: string
}

interface Chapter {
  chapter: string
  unix_timestamp: number
  token: string
}

interface PageData {
  series: Series | Series[]
  chapters?: Chapter[]
}

interface ScriptData {
  props: {
    pageProps: PageData
  }
}

class FlameComicsData extends BaseData {
  series: Series
  latestChapter: Chapter

  constructor(url: string, series: Series, latestChapter: Chapter) {
    super(url)
    this.series = series
    this.latestChapter = latestChapter
  }
}

export class FlameComics extends BaseSite {
  siteType = SiteType.FlameComics

  protected async readUrlImpl(url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    const scriptContent = doc.getElementById('__NEXT_DATA__')?.textContent
    if (!scriptContent) return new Error('Could not parse site')

    const scriptData = JSON.parse(scriptContent) as ScriptData
    const pageProps = scriptData.props.pageProps
    const { series, chapters } = pageProps

    if (Array.isArray(series) || !chapters?.[0]) {
      return new Error('Could not parse site data')
    }

    const data = new FlameComicsData(url, series, chapters[0])
    return this.buildManga(data)
  }

  protected override getTitle(data: FlameComicsData): string {
    return data.series.title
  }

  protected override getImage(data: FlameComicsData): string {
    const { series_id: id, cover } = data.series
    return `${this.getUrl()}/_next/image?url=https%3A%2F%2Fcdn.flamecomics.xyz%2Fseries%2F${id}%2F${cover}&w=1920&q=100`
  }

  protected override getChapter(data: FlameComicsData): string {
    const chapter = data.latestChapter.chapter
    
    if (chapter.endsWith('.0')) return chapter.replace('.0', '')
    else return chapter
  }

  protected override getChapterUrl(data: FlameComicsData): string {
    const id = data.series.series_id
    const token = data.latestChapter.token
    if (!token) return ''

    return `${this.getUrl()}/series/${id}/${token}`
  }

  protected override getChapterNum(data: FlameComicsData): number {
    return SiteUtils.parseNum(data.latestChapter.chapter?.trim())
  }

  protected override getChapterDate(data: FlameComicsData): string {
    const timestamp = data.latestChapter.unix_timestamp
    if (!timestamp) return ''

    const date = moment(timestamp * 1000)
    if (date.isValid()) return date.fromNow()
    else return ''
  }

  protected async searchImpl(query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/browse` }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    const scriptContent = doc.getElementById('__NEXT_DATA__')?.textContent
    if (!scriptContent) return new Error('Could not parse site')

    const scriptData = JSON.parse(scriptContent) as ScriptData
    const pageData = scriptData.props.pageProps

    if (!Array.isArray(pageData.series)) {
      return new Error('Could not parse site data')
    }

    const promises: Promise<Error | Manga>[] = []

    for (const series of pageData.series) {
      if (!titleContainsQuery(query, series.title)) continue

      const id = series.series_id
      const url = `${this.getUrl()}/series/${id}`

      promises.push(this.readUrl(url))
    }

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl(): string {
    return `${this.getUrl()}/series/61`
  }
}
