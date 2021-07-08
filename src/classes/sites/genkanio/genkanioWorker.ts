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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  search (_query: string): Promise<Error | Manga[]> {
    return Promise.resolve([])
  }
}
