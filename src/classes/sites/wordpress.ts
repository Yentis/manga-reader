import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import { BaseSite } from './baseSite'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio from 'cheerio'
import qs from 'qs'

export class WordPress extends BaseSite {
  siteType: SiteType;

  constructor (siteType: SiteType) {
    super()
    this.siteType = siteType
  }

  getLoginUrl (): string {
    return this.getUrl()
  }

  getImage (): string {
    if (this.image?.attr('src')?.startsWith('https://')) {
      return this.image.attr('src') || ''
    } else {
      return this.image?.attr('data-lazy-src') || this.image?.attr('data-cfsrc') || ''
    }
  }

  readUrl (url: string): Promise<Manga> {
    return new Promise((resolve, reject) => {
      axios.get(url).then(async response => {
        const $ = cheerio.load(response.data)

        if (this.siteType === SiteType.HiperDEX) {
          const mangaId = $('.rating-post-id').first().attr('value') || ''
          await this.readChapters(mangaId)
        } else {
          this.chapter = $('.wp-manga-chapter a').first()
        }
        this.image = $('.summary_image img').first()
        this.title = $('.post-title').first()

        resolve(this.buildManga(url))
      }).catch(error => reject(error))
    })
  }

  readChapters (mangaId: string): Promise<void> {
    return new Promise(resolve => {
      const data = qs.stringify({
        action: 'manga_get_chapters',
        manga: mangaId
      })

      const config: AxiosRequestConfig = {
        method: 'post',
        url: `${this.getUrl()}/wp-admin/admin-ajax.php`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data
      }

      axios(config).then((response) => {
        const $ = cheerio.load(response.data)
        this.chapter = $('.wp-manga-chapter a').first()

        resolve()
      }).catch(error => {
        console.error(error)
        resolve()
      })
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return new Promise(resolve => {
      const data = qs.stringify({
        action: 'wp-manga-search-manga',
        title: query
      })

      const config: AxiosRequestConfig = {
        method: 'post',
        url: `${this.getUrl()}/wp-admin/admin-ajax.php`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data
      }

      axios(config).then((response) => {
        const searchData = response.data as WordPressSearch
        if (!searchData.success) {
          resolve([])
          return
        }

        const promises: Promise<Manga>[] = []

        for (const item of searchData.data) {
          if (item.type !== 'manga') continue
          promises.push(this.readUrl(item.url))
        }

        Promise.all(promises)
          .then(mangaList => resolve(mangaList))
          .catch(error => resolve(error))
      }).catch(error => resolve(error))
    })
  }
}

interface WordPressSearch {
  success: boolean
  data: Array<{
    url: string
    type: string
  }>
}
