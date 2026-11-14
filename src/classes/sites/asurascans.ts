import { BaseData, BaseSite } from './baseSite'
import { SiteType } from 'src/enums/siteEnum'
import PQueue from 'p-queue'
import moment from 'moment'
import { Manga } from 'src/classes/manga'
import type { HttpRequest } from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'
import qs from 'qs'

interface AsuraProps {
  title: [number, string]
  coverUrl: [number, string]
}

interface AsuraChapterProps {
  chapters: [number, [number, AsuraChapter][]]
  publicUrl: [number, string]
}

interface AsuraChapter {
  created_at: [number, string]
  is_premium: [number, boolean]
  is_locked: [number, boolean]
  number: [number, number]
}

interface AsuraSearch {
  data: {
    title: string
    alt_titles: string[]
    cover: string
    latest_chapters: {
      number: number
    }[]
    source_url: string
  }[]
}

class AsuraData extends BaseData {
  props: AsuraProps
  chapterProps: AsuraChapterProps

  constructor(url: string, props: AsuraProps, chapterProps: AsuraChapterProps) {
    super(url)
    this.props = props
    this.chapterProps = chapterProps
  }
}

export class AsuraScans extends BaseSite {
  siteType: SiteType

  constructor() {
    super()

    this.siteType = SiteType.AsuraScans
    this.requestQueue = new PQueue({ interval: 2000, intervalCap: 1 })
  }

  private getAsuraChapter(data: AsuraData): AsuraChapter | undefined {
    const [, chapters] = data.chapterProps.chapters

    const chapterArray = chapters[0]
    if (!chapterArray) return undefined
    return chapterArray[1]
  }

  protected override getChapter(data: AsuraData): string {
    const chapterNum = this.getChapterNum(data)
    return `Chapter ${chapterNum}`
  }

  protected override getChapterUrl(data: AsuraData): string {
    const [, comicUrl] = data.chapterProps.publicUrl
    const chapterNum = this.getChapterNum(data)
    return `${this.getUrl()}${comicUrl}/chapter/${chapterNum}`
  }

  protected override getChapterNum(data: AsuraData): number {
    const chapter = this.getAsuraChapter(data)
    if (!chapter) return 0

    const [, chapterNum] = chapter.number
    return chapterNum
  }

  protected override getChapterDate(data: AsuraData): string {
    const chapter = this.getAsuraChapter(data)
    if (!chapter) return ''

    const [, chapterDateString] = chapter.created_at
    const chapterDate = moment(chapterDateString)

    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected override getImage(data: AsuraData): string {
    const [, image] = data.props.coverUrl
    return image
  }

  protected override getTitle(data: AsuraData): string {
    const [, title] = data.props.title
    return title
  }

  protected async readUrlImpl(url: string): Promise<Error | Manga> {
    const request: HttpRequest = {
      method: 'GET',
      url,
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    }

    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const astroIslands = Array.from(doc.querySelectorAll('astro-island'))

    const propsString = astroIslands
      .find((element) => {
        return element.getAttribute('component-url')?.includes('Description')
      })
      ?.getAttribute('props')
    if (!propsString) return new Error('No props found')

    const chapterPropsString = astroIslands
      .find((element) => {
        return element.getAttribute('component-url')?.includes('ChapterList')
      })
      ?.getAttribute('props')
    if (!chapterPropsString) return new Error('No chapter props found')

    const props = JSON.parse(propsString)
    const chapterProps = JSON.parse(chapterPropsString) as AsuraChapterProps
    const data = new AsuraData(url, props, chapterProps)

    const imageElements = doc.querySelectorAll('meta[property="og:image"]')
    let image: Element | undefined
    if (imageElements.length === 0) {
      image = doc.querySelectorAll('meta[name="twitter:image"]')[0] ?? doc.querySelectorAll('img[alt="poster"]')[0]
    } else image = imageElements[0]
    data.image = image

    return this.buildManga(data)
  }

  protected async searchImpl(query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({ q: query.replace(/’/g, "'") })
    const request: HttpRequest = {
      method: 'GET',
      url: `https://api.asurascans.com/api/search?${queryString}`,
      headers: { 'Content-Type': 'application/json' },
    }

    const response = await requestHandler.sendRequest(request)
    const searchData = JSON.parse(response.data) as AsuraSearch
    const mangaList: Manga[] = []

    searchData.data.forEach((entry) => {
      const url = `${this.getUrl()}${entry.source_url}`
      const manga = new Manga(url, this.siteType)
      manga.title = entry.title
      manga.image = entry.cover

      const chapterNum = entry.latest_chapters[0]?.number
      manga.chapter = chapterNum !== undefined ? `Chapter ${chapterNum}` : 'Unknown'

      const titles = [entry.title, ...entry.alt_titles]
      if (titles.some((title) => titleContainsQuery(title, query))) {
        mangaList.push(manga)
      }
    })

    return mangaList
  }

  getTestUrl(): string {
    return `${this.getUrl()}/s/1993`
  }
}
