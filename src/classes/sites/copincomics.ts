import moment from 'moment'
import qs from 'qs'
import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'

interface MangaEpisode {
  dailyUnlock: string,
  episodetitle: string,
  episodetitle2: string,
  episodepubdate: string
}

interface MangaData {
  body: {
    episodelist: MangaEpisode[],

    item: {
      titlename: string,
      thumbs: {
        thumb1x1: string
        thumb2x1: string
        thumb3x4: string
        thumb4x3: string
        thumb5x3: string
      }
    }
  }
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

  getLatestEpisode (): MangaEpisode | undefined {
    const episodes = this.mangaData.body.episodelist
    return episodes.reverse().find((episode) => episode.dailyUnlock === 'Y')
  }
}

export class CopinComics extends BaseSite {
  siteType = SiteType.CopinComics

  protected getChapter (data: CopinComicsData): string {
    return data.getLatestEpisode()?.episodetitle || 'Unknown'
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
    const date = data.getLatestEpisode()?.episodepubdate.substring(0, 8)
    if (date === undefined) return ''

    const chapterDate = moment(date, 'YYYYMMDD')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected getImage (data: CopinComicsData): string {
    const thumbnails = data.mangaData.body.item.thumbs
    return thumbnails.thumb3x4 || thumbnails.thumb4x3 || thumbnails.thumb1x1 || thumbnails.thumb5x3 || thumbnails.thumb2x1
  }

  protected getTitle (data: CopinComicsData): string {
    return data.mangaData.body.item.titlename
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const split = url.split('/')
    const comicId = split[split.length - 1]
    if (comicId === undefined) return Error('Could not parse data')

    const request: HttpRequest = {
      method: 'GET',
      url: `https://api.${SiteType.CopinComics}/s/v2/toon.json?titlepkey=${comicId}`
    }
    const response = await requestHandler.sendRequest(request)

    const mangaData = JSON.parse(response.data) as MangaData
    const data = new CopinComicsData(url, mangaData)

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({ q: query })
    const request: HttpRequest = { method: 'GET', url: `https://api.${SiteType.CopinComics}/q/a.json?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const responseData = JSON.parse(response.data) as SearchData

    const results = responseData.body.list
    const promises: Promise<Manga | Error>[] = []

    results.forEach((entry) => {
      const title = entry.titlename
      const url = `${this.getUrl()}/toon/${entry.titlepkey}`
      if (!url) return

      if (titleContainsQuery(query, title)) {
        promises.push(this.readUrl(url))
      }
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl (): string {
    return `${this.getUrl()}/toon/301`
  }
}
