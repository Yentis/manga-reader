import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import { BaseSite } from './baseSite'
import axios from 'axios'
import cheerio from 'cheerio'

export class MangaDex extends BaseSite {
  siteType = SiteType.MangaDex

  constructor () {
    super()
    this.checkLogin()
  }

  canSearch (): boolean {
    return this.loggedIn
  }

  checkLogin (): void {
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

  readUrl (url: string): Promise<Error | Manga> {
    return new Promise(resolve => {
      axios.get(url).then(response => {
        const $ = cheerio.load(response.data)
        this.chapter = $('.chapter-row a').first()
        this.image = $('.row img').first()
        this.title = $('.card-header .mx-1').first()
        this.chapterDate = $('.chapter-row div[title]').first()

        resolve(this.buildManga(url))
      }).catch(error => resolve(error))
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

        const promises: Promise<Error | Manga>[] = []

        $('.ml-1.manga_title').each((_index, elem) => {
          const url = $(elem).attr('href') || ''
          promises.push(this.readUrl(this.processUrl(url)))
        })

        Promise.all(promises)
          .then(mangaList => resolve(mangaList.filter(manga => manga instanceof Manga) as Manga[]))
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
