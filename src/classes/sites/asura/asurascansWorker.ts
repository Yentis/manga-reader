import { BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios, { AxiosRequestConfig } from 'axios'
import { Manga } from '../../manga'
import cheerio from 'cheerio'
import { SiteType } from '../../../enums/siteEnum'

export class AsuraScansWorker extends BaseWorker {
  static siteType = SiteType.AsuraScans
  static url = `${BaseWorker.urlPrefix}https://www.${AsuraScansWorker.siteType}`

  static testUrl = `${AsuraScansWorker.url}/manga/tougen-anki/`

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(AsuraScansWorker.siteType, requestConfig)
  }

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
    return this.image?.attr('content') || ''
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    this.chapter = $('.chapternum').first()
    this.chapterDate = $('.chapterdate').first()
    this.chapterNum = $('#chapterlist li').first()
    this.image = $('meta[property="og:image"]').first()
    this.title = $('.entry-title').first()

    return this.buildManga(url)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const data = `action=ts_ac_do_search&ts_ac_query=${encodeURIComponent(query)}`
    const response = await axios({
      method: 'post',
      url: `${AsuraScansWorker.url}/wp-admin/admin-ajax.php`,
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
