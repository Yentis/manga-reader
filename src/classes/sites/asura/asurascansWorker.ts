import { BaseData, BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios from 'axios'
import { Manga } from '../../manga'
import cheerio, { Cheerio, Element } from 'cheerio'
import { SiteType } from '../../../enums/siteEnum'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { ContentType } from 'src/enums/contentTypeEnum'

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

class AsuraScansData extends BaseData {
  chapterUrl?: Cheerio<Element>
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

  getChapterUrl (data: AsuraScansData): string {
    return data.chapterUrl?.attr('href') || ''
  }

  getChapterNum (data: BaseData): number {
    return this.parseNum(data.chapterNum?.attr('data-num'))
  }

  getChapterDate (data: BaseData): string {
    const chapterDate = moment(data.chapterDate?.text(), 'MMMM DD, YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  getImage (data: BaseData): string {
    return data.image?.attr('content') || ''
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)
    const chapterItem = $('#chapterlist li').first()

    const data = new AsuraScansData(url)
    data.chapter = chapterItem.find('.chapternum').first()
    data.chapterUrl = chapterItem.find('a').first()
    data.chapterNum = chapterItem.first()
    data.chapterDate = chapterItem.find('.chapterdate').first()
    data.image = $('meta[property="og:image"]').first()
    data.title = $('.entry-title').first()

    return this.buildManga(data)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const data = `action=ts_ac_do_search&ts_ac_query=${encodeURIComponent(query)}`
    const response = await axios({
      method: 'post',
      url: `${AsuraScansWorker.getUrl(this.siteType)}/wp-admin/admin-ajax.php`,
      headers: {
        'Content-Type': `${ContentType.URLENCODED}; charset=UTF-8`
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
