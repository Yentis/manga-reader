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

    getImage (): string {
      return this.image?.attr('data-src') || ''
    }

    getTestUrl (): string {
      return 'https://asurascans.com/manga/tougen-anki/'
    }

    readUrl (url: string): Promise<Error | Manga> {
      return this.addToQueue(async () => {
        const response = await axios.get(url)
        const $ = cheerio.load(response.data)

        this.chapter = $('.chapternum').first()
        this.chapterDate = $('.chapterdate').first()
        this.chapterNum = $('#chapterlist li').first()
        this.image = $('.wp-post-image').first()
        this.title = $('.entry-title').first()

        return this.buildManga(url)
      })
    }

    search (query: string): Promise<Error | Manga[]> {
      return this.addToQueue(async () => {
        const data = `action=ts_ac_do_search&ts_ac_query=${encodeURIComponent(query)}`
        const response = await axios({
          method: 'post',
          url: `${this.getUrl()}/wp-admin/admin-ajax.php`,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
          },
          data
        })

        const searchData = response.data as AsuraScansSearch
        if (!searchData.series) {
          return []
        }
        const mangaList = []

        for (const entry of searchData.series) {
          for (const entryItem of entry.all) {
            if (!this.titleContainsQuery(query, entryItem.post_title)) continue

            const manga = new Manga('', this.siteType)
            manga.title = entryItem.post_title
            manga.image = entryItem.post_image
            manga.chapter = entryItem.post_latest
            manga.url = entryItem.post_link

            mangaList.push(manga)
          }
        }

        return mangaList
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
