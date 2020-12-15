import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import { BaseSite } from './baseSite'
import axios from 'axios'
import cheerio from 'cheerio'

export class Genkan extends BaseSite {
  siteType: SiteType

  constructor (siteType: SiteType) {
    super()
    this.siteType = siteType
    this.checkState()
  }

  getImage (): string {
    return this.image?.css('background-image').replace(new RegExp('url\\("?', 'g'), this.getUrl()).replace(new RegExp('"?\\)', 'g'), '') || ''
  }

  getTestUrl (): string {
    switch (this.siteType) {
      case SiteType.KKJScans:
        return 'https://kkjscans.co/comics/688015-the-rebirth-of-an-8th-circled-wizard'
      case SiteType.HatigarmScans:
        return 'https://hatigarmscanz.net/comics/848996-ichizu-de-bitch-na-kouhai'
      case SiteType.MethodScans:
        return 'https://methodscans.com/comics/773532-meng-shi-zai-shang'
      case SiteType.LeviatanScans:
        return 'https://leviatanscans.com/comics/909261-stresser'
      case SiteType.ReaperScans:
        return 'https://reaperscans.com/comics/621295-alpha'
    }

    return this.getUrl()
  }

  readUrl (url: string): Promise<Error | Manga> {
    return this.addToQueue(async () => {
      const response = await axios.get(url)
      const $ = cheerio.load(response.data)

      const chapterElem = $('.list-item.col-sm-3 a')
      this.chapter = chapterElem.first()
      this.chapterDate = chapterElem.eq(1)
      this.chapterNum = $('.list-item.col-sm-3 span').first()
      this.image = $('.media-content').first()
      this.title = $('.text-highlight').first()

      return this.buildManga(url)
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return this.addToQueue(async () => {
      const response = await axios.get(`${this.getUrl()}/comics`, {
        params: {
          query
        }
      })
      const $ = cheerio.load(response.data)
      const promises: Promise<Error | Manga>[] = []

      if (this.siteType === SiteType.MethodScans) {
        $('.list-item.rounded').each((_index, elem) => {
          const titleElem = $(elem).find('.list-body a').first()
          const title = titleElem.html() || ''
          const url = titleElem.attr('href') || ''

          if (title.toLowerCase().includes(query.toLowerCase()) && url) {
            promises.push(this.readUrl(url))
          }
        })
      } else {
        $('.list-item.rounded').each((_index, elem) => {
          const url = $(elem).find('.media-content').first().attr('href') || ''
          const title = $(elem).find('.list-body a').first().html() || ''

          if (title.toLowerCase().includes(query.toLowerCase()) && url) {
            promises.push(this.readUrl(url))
          }
        })
      }

      const mangaList = await Promise.all(promises)
      return mangaList.filter(manga => manga instanceof Manga) as Manga[]
    })
  }
}
