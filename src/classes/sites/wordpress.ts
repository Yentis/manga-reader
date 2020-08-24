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
    return this.getImageSrc(this.image)
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
        this.title = $('.rate-title').first()

        resolve(this.buildManga(url))
      }).catch(error => reject(error))
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return new Promise(resolve => {
      let queryString = ''
      query.split(' ').forEach((word, index) => {
        if (index > 0) {
          queryString = queryString + '+'
        }
        queryString = queryString + word
      })

      axios({
        method: 'get',
        url: `${this.getUrl()}?s=${queryString}&post_type=wp-manga`
      }).then(response => {
        const $ = cheerio.load(response.data)
        const mangaList: Manga[] = []

        $('.c-tabs-item__content').each((_index, elem) => {
          const cheerioElem = $(elem)
          const imageElem = cheerioElem.find('a').first()
          const manga = new Manga(imageElem.attr('href') || '', this.siteType)

          manga.image = this.getImageSrc(imageElem.find('img').first())
          manga.title = cheerioElem.find('.post-title').first().text().trim()
          manga.chapter = cheerioElem.find('.font-meta.chapter').first().text()

          mangaList.push(manga)
        })

        resolve(mangaList)
      }).catch(error => resolve(error))
    })
  }

  private readChapters (mangaId: string): Promise<void> {
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

  private getImageSrc (elem: Cheerio | undefined) {
    return elem?.attr('data-src') || elem?.attr('data-lazy-src') || elem?.attr('data-cfsrc') || elem?.attr('src') || ''
  }
}
