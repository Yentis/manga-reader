import moment from 'moment'
import qs from 'qs'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'

interface MangaData {
  episode: {
    episodetitle: string,
    episodepubdate: string
  }[],
  thumbs: {
    thumb1x1: string
    thumb2x1: string
    thumb3x4: string
    thumb4x3: string
    thumb5x3: string
  },
  titlename: string
}

interface SearchData {
  body: {
    list: {
      titlename: string,
      titlepkey: string
    }[]
  }
}

class CopinComicsData extends BaseData {
  mangaData: MangaData

  constructor (url: string, mangaData: MangaData) {
    super(url)
    this.mangaData = mangaData
  }
}

export class CopinComics extends BaseSite {
  siteType = SiteType.CopinComics

  protected getChapter (data: CopinComicsData): string {
    const episodes = data.mangaData.episode
    return episodes[episodes.length - 1]?.episodetitle || 'Unknown'
  }

  protected getChapterNum (data: CopinComicsData): number {
    const chapter = this.getChapter(data)
    if (!chapter) return 0

    const pattern = /[\d\\.,]+\b/gm
    let num = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(chapter)) !== null) {
      const matchedValue = match[0]
      if (!matchedValue) continue

      const parsedMatch = parseFloat(matchedValue)
      if (!isNaN(parsedMatch)) {
        num = parsedMatch
        break
      }
    }

    return num
  }

  protected getChapterDate (data: CopinComicsData): string {
    const episodes = data.mangaData.episode
    const date = episodes[episodes.length - 1]?.episodepubdate.substring(0, 8)
    if (date === undefined) return ''

    const chapterDate = moment(date, 'YYYYMMDD')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected getImage (data: CopinComicsData): string {
    const thumbnails = data.mangaData.thumbs
    return thumbnails.thumb3x4 || thumbnails.thumb4x3 || thumbnails.thumb1x1 || thumbnails.thumb5x3 || thumbnails.thumb2x1
  }

  protected getTitle (data: CopinComicsData): string {
    return data.mangaData.titlename
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const lines = doc.querySelectorAll('.wrap script')[0]?.innerHTML.trim().split('\n').map((line) => line.trim())
    const dataTitle = lines?.find((line) => line.startsWith('var data_title'))?.replace('var data_title = ', '')
    if (dataTitle === undefined) return Error('Could not parse data')

    const mangaData = JSON.parse(dataTitle.substring(0, dataTitle.length - 1)) as MangaData
    const data = new CopinComicsData(url, mangaData)

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({ q: query })
    const request: HttpRequest = { method: 'GET', url: `https://api.copincomics.com/q/a.json?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const responseData = JSON.parse(response.data) as SearchData

    const results = responseData.body.list
    const promises: Promise<Manga | Error>[] = []

    results.forEach((entry) => {
      const title = entry.titlename
      const url = `${this.getUrl()}/?c=toon&k=${entry.titlepkey}`
      if (!url) return

      if (titleContainsQuery(query, title)) {
        promises.push(this.readUrl(url))
      }
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl (): string {
    return `${this.getUrl()}/?c=toon&k=301`
  }
}
