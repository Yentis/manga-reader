import { BaseData, BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio, { Cheerio, Element, Node } from 'cheerio'
import { Manga } from '../../manga'
import { LooseDictionary } from 'quasar/dist/types'
import { SiteType } from '../../../enums/siteEnum'

const MOBILE_USER_AGENT = 'Mozilla/5.0 (Linux; Android 7.1.2; LEX820) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Mobile Safari/537.36'

interface WebtoonsSearch {
  query: string[]
  items: string[][][][]
}

class WebtoonsData extends BaseData {
  chapterUrl?: Cheerio<Element | Node>
}

export class WebtoonsWorker extends BaseWorker {
  static siteType = SiteType.Webtoons
  static url = `${BaseWorker.urlPrefix}https://www.${WebtoonsWorker.siteType}`
  static testUrl = `${WebtoonsWorker.url}/en/comedy/wolf-and-red-riding-hood/list?title_no=2142`

  platform: LooseDictionary | undefined

  constructor (platform: LooseDictionary | undefined = undefined, requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(WebtoonsWorker.siteType, requestConfig)
    this.platform = platform
  }

  getChapterNum (data: BaseData): number {
    return this.parseNum(data.chapterNum?.attr('data-episode-no'))
  }

  getChapterUrl (data: WebtoonsData): string {
    return data.chapterUrl?.attr('href') || ''
  }

  getChapterDate (data: BaseData): string {
    const chapterDate = moment(data.chapterDate?.text().trim(), 'MMM DD, YYYY')
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
    const mobile = url.includes('//m.' + this.siteType)
    const headers = mobile && this.platform?.mobile !== true
      ? {
          common: {
            'User-Agent': MOBILE_USER_AGENT
          }
        }
      : null
    const response = await axios.get(url, { headers })
    const $ = cheerio.load(response.data)

    const data = new WebtoonsData(url)
    data.image = $('meta[property="og:image"]').first()
    data.chapterDate = $('.date').first()

    if (mobile || this.platform?.mobile === true) {
      data.chapter = $('.sub_title span').first()
      data.chapterUrl = $('li[data-episode-no] a').first()
      data.chapterNum = $('#_episodeList li[data-episode-no]').first()
      data.title = $('._btnInfo .subj').first()
    } else {
      data.chapter = $('#_listUl .subj span').first()
      data.chapterUrl = $('#_listUl a').first()
      data.chapterNum = $('#_listUl li').first()
      data.title = $('.info .subj').first()
    }

    return this.buildManga(data)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const response = await axios.get(`https://ac.${this.siteType}/ac`, {
      params: {
        q: `en^${query}`,
        st: 1
      }
    })

    const searchData = response.data as WebtoonsSearch
    const promises: Promise<Error | Manga>[] = []

    for (const firstIndent of searchData.items) {
      for (const item of firstIndent) {
        const title = item[0][0]
        if (!this.titleContainsQuery(query, title)) continue
        const url = `${WebtoonsWorker.url}/episodeList?titleNo=${item[3][0]}`
        promises.push(this.readUrl(url))
      }
    }

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }
}
