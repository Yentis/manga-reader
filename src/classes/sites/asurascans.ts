import { SiteType } from '../../enums/siteEnum'
import { Manga } from '../manga'
import { BaseSite } from './baseSite'
import axios from 'axios'
import cheerio from 'cheerio'
import moment from 'moment'

export class AsuraScans extends BaseSite {
    siteType = SiteType.AsuraScans

    getChapterNum (): number {
      return this.parseNum(this.chapterNum?.attr('data-num'))
    }

    getChapterUrl (): string {
      return this.chapter?.parent()?.attr('href') || ''
    }

    getChapterDate (): string {
      const chapterDate = moment(this.chapterDate?.text(), 'MMMM DD, YYYY')
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
          this.chapter = $('.chapternum').first()
          this.chapterDate = $('.chapterdate').first()
          this.chapterNum = $('#chapterlist li').first()
          this.image = $('.wp-post-image').first()
          this.title = $('.entry-title').first()

          resolve(this.buildManga(url))
        }).catch(error => resolve(error))
      })
    }

    search (query: string): Promise<Error | Manga[]> {
      return new Promise(resolve => {
        const data = `action=ts_ac_do_search&ts_ac_query=${encodeURIComponent(query)}`

        axios({
          method: 'post',
          url: `${this.getUrl()}/wp-admin/admin-ajax.php`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          data
        }).then(response => {
          const searchData = response.data as AsuraScansSearch
          if (!searchData.series) {
            return resolve([])
          }
          const mangaList = []

          for (const entry of searchData.series) {
            for (const entryItem of entry.all) {
              if (!entryItem.post_title.toLowerCase().includes(query.toLowerCase())) continue

              const manga = new Manga('', this.siteType)
              manga.title = entryItem.post_title
              manga.image = entryItem.post_image
              manga.chapter = entryItem.post_latest
              manga.url = entryItem.post_link

              mangaList.push(manga)
            }
          }

          resolve(mangaList)
        }).catch(error => resolve(error))
      })
    }
}

interface AsuraScansSearch {
    series: Array<{ all: Array< {
        'post_title': string,
        'post_image': string,
        'post_latest': string,
        'post_link': string
    } > }>
}
