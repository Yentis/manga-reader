import { BaseWorker } from '../baseWorker'
import moment from 'moment'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio from 'cheerio'
import { Manga } from '../../manga'
import { LooseDictionary } from 'quasar'
import { SiteType } from '../../../enums/siteEnum'

const MOBILE_USER_AGENT = 'Mozilla/5.0 (Linux; Android 7.1.2; LEX820) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Mobile Safari/537.36'

export class WebtoonsWorker extends BaseWorker {
  static siteType = SiteType.Webtoons
  static url = `https://www.${WebtoonsWorker.siteType}`
  static testUrl = `${WebtoonsWorker.url}/en/comedy/wolf-and-red-riding-hood/list?title_no=2142`

  platform: LooseDictionary | undefined
  chapterUrl: cheerio.Cheerio | undefined

  constructor (platform: LooseDictionary | undefined = undefined, requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(WebtoonsWorker.siteType, requestConfig)
    this.platform = platform
  }

  getChapterNum (): number {
    return this.parseNum(this.chapterNum?.attr('data-episode-no'))
  }

  getChapterUrl (): string {
    return this.chapterUrl?.attr('href') || ''
  }

  getChapterDate (): string {
    const chapterDate = moment(this.chapterDate?.text().trim(), 'MMM DD, YYYY')
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
    const mobile = url.includes('//m.' + this.siteType)
    const headers = mobile && this.platform?.mobile !== true ? {
      common: {
        'User-Agent': MOBILE_USER_AGENT
      }
    } : null
    const response = await axios.get(url, { headers })
    const $ = cheerio.load(response.data)

    this.image = $('meta[property="og:image"]').first()
    this.chapterDate = $('.date').first()

    if (mobile || this.platform?.mobile === true) {
      this.chapter = $('.sub_title span').first()
      this.chapterUrl = $('li[data-episode-no] a').first()
      this.chapterNum = $('#_episodeList li').first()
      this.title = $('._btnInfo .subj').first()
    } else {
      this.chapter = $('#_listUl .subj span').first()
      this.chapterUrl = $('#_listUl a').first()
      this.chapterNum = $('#_listUl li').first()
      this.title = $('.info .subj').first()
    }

    return this.buildManga(url)
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

interface WebtoonsSearch {
  query: Array<string>;
  items: Array<Array<Array<Array<string>>>>
}
