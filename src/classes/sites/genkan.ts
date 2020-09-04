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

  readUrl (url: string): Promise<Error | Manga> {
    return new Promise(resolve => {
      axios.get(url).then(response => {
        const $ = cheerio.load(response.data)
        this.chapter = $('.list-item.col-sm-3 a').first()
        this.image = $('.media-content').first()
        this.title = $('.text-highlight').first()

        resolve(this.buildManga(url))
      }).catch(error => resolve(error))
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
        const promises: Promise<Error | Manga>[] = []

        if (this.siteType === SiteType.MethodScans) {
          const words = query.split(' ')

          $('.list-item.rounded').each((_index, elem) => {
            const titleElem = $(elem).find('.list-body a').first()
            const title = titleElem.html() || ''
            const url = titleElem.attr('href') || ''

            for (const word of words) {
              if (title.toLowerCase().includes(word.toLowerCase()) && url) {
                promises.push(this.readUrl(url))
                return
              }
            }
          })
        } else {
          $('.list-item.rounded').each((_index, elem) => {
            const url = $(elem).find('.media-content').first().attr('href') || ''
            promises.push(this.readUrl(url))
          })
        }

        Promise.all(promises)
          .then(mangaList => resolve(mangaList.filter(manga => manga instanceof Manga) as Manga[]))
          .catch(error => resolve(error))
      }).catch(error => resolve(error))
    })
  }
}
