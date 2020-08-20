import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import { BaseSite } from './baseSite'
import axios from 'axios'
import cheerio from 'cheerio'

export class MangaDex extends BaseSite {
  siteType = SiteType.MangaDex

  constructor () {
    super()
    this.search('together with the rain').then(results => {
      this.loggedIn = !(results instanceof Error)
    }).catch(error => console.error(error))
  }

  getChapter (): string {
    return this.chapter?.text().replace(/ +(?= )/g, '') || 'Unknown'
  }

  getChapterUrl (): string {
    const href = this.chapter?.attr('href') || ''
    return this.processUrl(href)
  }

  readUrl (url: string): Promise<Manga> {
    return new Promise((resolve, reject) => {
      axios.get(url).then(response => {
        const $ = cheerio.load(response.data)
        this.chapter = $('.chapter-row a').first()
        this.image = $('.row img').first()
        this.title = $('.card-header .mx-1').first()

        resolve(this.buildManga(url))
      }).catch(error => reject(error))
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return new Promise(resolve => {
      axios.get(`${this.getUrl()}/search`, {
        params: {
          title: query
        }
      }).then(response => {
        const $ = cheerio.load(response.data)

        if ($('#login_button').length === 1) {
          resolve(Error('Login required'))
          return
        }

        const promises: Promise<Manga>[] = []

        $('.ml-1.manga_title').each((_index, elem) => {
          const url = $(elem).attr('href') || ''
          promises.push(this.readUrl(this.processUrl(url)))
        })

        Promise.all(promises)
          .then(mangaList => resolve(mangaList))
          .catch(error => resolve(error))
      }).catch(error => resolve(error))
    })
  }

  private processUrl (url: string): string {
    if (url && !url.startsWith('https://')) {
      return this.getUrl() + url.replace('file//', '') || ''
    } else {
      return url
    }
  }
}
