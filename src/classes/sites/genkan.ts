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
  }

  getImage (): string {
    return this.image?.css('background-image').replace(new RegExp('url\\("?', 'g'), this.getUrl()).replace(new RegExp('"?\\)', 'g'), '') || ''
  }

  readUrl (url: string): Promise<Manga> {
    return new Promise((resolve, reject) => {
      axios.get(url).then(response => {
        const $ = cheerio.load(response.data)
        this.chapter = $('.list-item.col-sm-3 a').first()
        this.image = $('.media-content').first()
        this.title = $('.text-highlight').first()

        resolve(this.buildManga(url))
      }).catch(error => reject(error))
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return new Promise(resolve => {
      axios.get(`${this.getUrl()}/comics`, {
        params: {
          query
        }
      }).then(response => {
        const $ = cheerio.load(response.data)
        const promises: Promise<Manga>[] = []

        $('.list-item.rounded').each((_index, elem) => {
          const url = $(elem).find('.media-content').first().attr('href') || ''
          promises.push(this.readUrl(url))
        })

        Promise.all(promises)
          .then(mangaList => resolve(mangaList))
          .catch(error => resolve(error))
      }).catch(error => resolve(error))
    })
  }
}
