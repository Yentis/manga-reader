import { BaseWorker } from '../baseWorker'
import { Manga } from '../../manga'
import { SiteType } from '../../../enums/siteEnum'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio, { Cheerio, Element } from 'cheerio'

export class GenkanioWorker extends BaseWorker {
  static siteType = SiteType.Genkan
  static url = BaseWorker.getUrl(GenkanioWorker.siteType)

  static testUrl = `${GenkanioWorker.url}/manga/8383424626-castle`

  chapterUrl?: Cheerio<Element>

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(GenkanioWorker.siteType, requestConfig)
  }

  getChapter (): string {
    const url = super.getChapter()
    if (url === '-') return `Chapter ${this.getChapterNum()}`
    return url
  }

  getChapterUrl (): string {
    return this.chapterUrl?.attr('href') || ''
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const columns = $('tbody tr').first().children()

    this.chapter = columns.eq(1)
    this.chapterUrl = columns.last().find('a').first()
    this.chapterNum = columns.first()
    this.image = $('section img').first()
    this.title = $('h2').first()
    this.chapterDate = columns.eq(5)

    return this.buildManga(url)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const response = await axios.get(`${GenkanioWorker.url}/manga?search=${encodeURIComponent(query)}`)
    const $ = cheerio.load(response.data)
    const mangaList: Manga[] = []

    $('div ul li').each((_index, elem) => {
      const manga = new Manga('', this.siteType)
      manga.title = $(elem).text().trim()
      manga.url = $(elem).find('a').first().attr('href') || ''

      if (this.titleContainsQuery(query, manga.title)) {
        mangaList.push(manga)
      }
    })

    const fullMangaList: Manga[] = []
    for (const manga of mangaList) {
      const detailedManga = await this.readUrl(manga.url)
      if (detailedManga instanceof Error) continue

      fullMangaList.push(detailedManga)
    }

    return fullMangaList
  }
}
