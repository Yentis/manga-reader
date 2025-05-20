import { BaseData, BaseSite } from './baseSite'
import { SiteType } from 'src/enums/siteEnum'
import moment from 'moment'
import { Manga } from 'src/classes/manga'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import * as SiteUtils from 'src/utils/siteUtils'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import qs from 'qs'

interface ScriptData {
  props: {
    pageProps: {
      comic: Comic
    }
  }
}

interface Comic {
  hid: string,
  title: string,
  slug: string,
  md_covers: { b2key: string }[],
}

interface SearchResponse {
  slug: string,
  title: string,
  md_titles?: { title: string }[],
}

interface ChaptersResponse {
  chapters: Chapter[],
}

interface Chapter {
  chap: string,
  title?: string,
  created_at: string,
  hid: string,
  vol?: string,
}

class ComicKData extends BaseData {
  comic: Comic
  chapter: Chapter

  constructor(url: string, comic: Comic, chapter: Chapter) {
    super(url)
    this.comic = comic
    this.chapter = chapter
  }
}

export class ComicK extends BaseSite {
  siteType = SiteType.ComicK

  protected override getChapter(data: ComicKData): string {
    const chapterName: string[] = []

    if (data.chapter.vol) {
      chapterName.push(`Vol. ${data.chapter.vol}`)
    }

    chapterName.push(`Ch. ${data.chapter.chap}`)

    if (data.chapter.title) {
      chapterName.push(data.chapter.title)
    }

    return chapterName.join(' ')
  }

  protected override getChapterUrl(data: ComicKData): string {
    return `${this.getUrl()}/comic/${data.comic.slug}/${data.chapter.hid}`
  }

  protected override getChapterNum (data: ComicKData): number {
    return SiteUtils.parseNum(data.chapter.chap?.trim())
  }

  protected override getChapterDate(data: ComicKData): string {
    const dateText = data.chapter.created_at
    return moment(dateText).fromNow()
  }

  protected override getImage(data: ComicKData): string {
    const imageName = data.comic.md_covers[0]?.b2key
    return imageName ? `https://meo.comick.pictures/${imageName}` : ''
  }

  protected override getTitle(data: ComicKData): string {
    return data.comic.title ?? ''
  }

  protected async readUrlImpl(url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)

    const scriptContent = doc.getElementById('__NEXT_DATA__')?.textContent
    if (!scriptContent) return new Error('Could not parse site')

    const scriptData = JSON.parse(scriptContent) as ScriptData
    const pageProps = scriptData.props.pageProps
    const hid = pageProps.comic.hid

    const chaptersRequest: HttpRequest = {
      method: 'GET',
      url: `https://api.comick.io/comic/${hid}/chapters`,
      headers: {
        'Referer': this.getUrl(),
      },
    }

    const chaptersResponse = await requestHandler.sendRequest(chaptersRequest)
    const chaptersData = JSON.parse(chaptersResponse.data) as ChaptersResponse

    const chapter = chaptersData.chapters[0]
    if (!chapter) return new Error('No chapters found')

    const data = new ComicKData(url, pageProps.comic, chapter)
    return this.buildManga(data)
  }

  protected async searchImpl(query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      q: query,
      t: true,
    })

    const request: HttpRequest = {
      method: 'GET',
      url: `https://api.comick.io/v1.0/search?${queryString}`,
    }

    const response = await requestHandler.sendRequest(request)
    const data = JSON.parse(response.data) as SearchResponse[]
    const promises: Promise<Manga | Error>[] = []

    data.forEach((result) => {
      const url = `${this.getUrl()}/comic/${result.slug}`

      const match = titleContainsQuery(query, result.title) || (result.md_titles?.some((titleEntry) => {
        return titleContainsQuery(query, titleEntry.title)
      }) === true)

      if (match) {
        promises.push(this.readUrl(url))
      }
    })

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl(): string {
    return `${this.getUrl()}/comic/02-trophy-husband`
  }
}
