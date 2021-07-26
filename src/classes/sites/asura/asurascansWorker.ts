import { BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios from 'axios'
import { Manga } from '../../manga'
import cheerio, { Cheerio, Element } from 'cheerio'
import { SiteType } from '../../../enums/siteEnum'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'

interface AsuraScansSearch {
  series: {
    all: {
      'post_title': string,
      'post_image': string,
      'post_latest': string,
      'post_link': string
    }[]
  }[]
}

export class AsuraScansWorker extends BaseWorker {
  static getUrl (siteType: SiteType | LinkingSiteType): string {
    switch (siteType) {
      case SiteType.AsuraScans:
        return `${BaseWorker.urlPrefix}https://www.${siteType}`
    }

    return BaseWorker.getUrl(siteType)
  }

  static getTestUrl (siteType: SiteType | LinkingSiteType) : string {
    switch (siteType) {
      case SiteType.AsuraScans:
        return `${AsuraScansWorker.getUrl(siteType)}/manga/tougen-anki/`
      case SiteType.FlameScans:
        return `${AsuraScansWorker.getUrl(siteType)}/series/you-the-one-and-only-and-the-seven-billion-grim-reapers/`
    }

    return AsuraScansWorker.getUrl(siteType)
  }

  chapterUrl?: Cheerio<Element>

  getChapterUrl (): string {
    return this.chapterUrl?.attr('href') || ''
  }

  getChapterNum (): number {
    return this.parseNum(this.chapterNum?.attr('data-num'))
  }

  getChapterDate (): string {
    const chapterDate = moment(this.chapterDate?.text(), 'MMMM DD, YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const chapterItem = $('#chapterlist li').first()

    this.chapter = chapterItem.find('.chapternum').first()
    this.chapterUrl = chapterItem.find('a').first()
    this.chapterNum = chapterItem.first()
    this.chapterDate = chapterItem.find('.chapterdate').first()
    this.image = $('div[itemprop="image"] img').first()
    this.title = $('.entry-title').first()

    return this.buildManga(url)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const data = `action=ts_ac_do_search&ts_ac_query=${encodeURIComponent(query)}`
    const response = await axios({
      method: 'post',
      url: `${AsuraScansWorker.getUrl(this.siteType)}/wp-admin/admin-ajax.php`,
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
