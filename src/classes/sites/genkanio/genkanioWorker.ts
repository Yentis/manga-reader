import { BaseData, BaseWorker } from '../baseWorker'
import { Manga } from '../../manga'
import { SiteType } from '../../../enums/siteEnum'
import axios from 'axios'
import cheerio, { Cheerio, Element } from 'cheerio'

class GenkanioData extends BaseData {
  chapterUrl?: Cheerio<Element>
}

export class GenkanioWorker extends BaseWorker {
  static siteType = SiteType.Genkan
  static url = BaseWorker.getUrl(GenkanioWorker.siteType)

  static testUrl = `${GenkanioWorker.url}/manga/8383424626-castle`

  constructor () {
    super(GenkanioWorker.siteType)
  }

  getChapter (data: BaseData): string {
    const url = super.getChapter(data)
    if (url === '-') return `Chapter ${this.getChapterNum(data)}`
    return url
  }

  getChapterUrl (data: GenkanioData): string {
    return data.chapterUrl?.attr('href') || ''
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const columns = $('tbody tr').first().children()

    const data = new GenkanioData(url)
    data.chapter = columns.eq(1)
    data.chapterUrl = columns.last().find('a').first()
    data.chapterNum = columns.first()
    data.image = $('section img').first()
    data.title = $('h2').first()
    data.chapterDate = columns.eq(5)

    return this.buildManga(data)
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  search (_query: string): Promise<Error | Manga[]> {
    return Promise.resolve([])
  }
}
