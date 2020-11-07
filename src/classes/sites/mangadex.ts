import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import { BaseSite } from './baseSite'
import axios from 'axios'
import cheerio from 'cheerio'
import moment from 'moment'
import relevancy from 'relevancy'

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

  getChapterNum (): number {
    return this.parseNum(this.chapterNum?.attr('data-chapter'))
  }

  getChapterUrl (): string {
    const href = this.chapter?.attr('href') || ''
    return this.processUrl(href)
  }

  getChapterDate (): string {
    const chapterDate = moment.utc(this.chapterDate?.attr('title'), 'YYYY-MM-DD hh:mm:ss')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  readUrl (url: string): Promise<Error | Manga> {
    return new Promise(resolve => {
      axios.get(url).then(response => {
        const $ = cheerio.load(response.data)
        this.chapter = $('.chapter-row a').first()
        this.chapterNum = $('.chapter-row').eq(1)
        this.chapterDate = $('.chapter-row div[title]').first()
        this.image = $('.row img').first()
        this.title = $('.card-header .mx-1').first()

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

        let candidateUrls: string[] = []
        const promises: Promise<Error | Manga>[] = []

        $('.ml-1.manga_title').each((_index, elem) => {
          if ($(elem).text().toLowerCase().includes(query.toLowerCase())) {
            const url = $(elem).attr('href') || ''
            candidateUrls.push(this.processUrl(url))
          }
        })
        candidateUrls = relevancy.sort(candidateUrls, query)

        for (let i = 0; i < Math.min(5, candidateUrls.length); i++) {
          promises.push(this.readUrl(candidateUrls[i]))
        }

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
