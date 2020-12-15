import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import { BaseSite } from './baseSite'
import { Platform } from 'quasar'
import axios from 'axios'
import cheerio from 'cheerio'
import moment from 'moment'

const MOBILE_USER_AGENT = 'Mozilla/5.0 (Linux; Android 7.1.2; LEX820) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Mobile Safari/537.36'

export class Webtoons extends BaseSite {
  chapterUrl: Cheerio | undefined
  siteType = SiteType.Webtoons

  constructor () {
    super()
    this.checkState()
  }

  getUrl (): string {
    return `https://www.${this.siteType}`
  }

  getLoginUrl (): string {
    return this.getUrl()
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

  getTestUrl (): string {
    return 'https://www.webtoons.com/en/comedy/wolf-and-red-riding-hood/list?title_no=2142'
  }

  readUrl (url: string): Promise<Error | Manga> {
    return this.addToQueue(async () => {
      const mobile = url.includes('//m.' + this.siteType)
      const headers = mobile && Platform.is?.mobile !== true ? {
        common: {
          'User-Agent': MOBILE_USER_AGENT
        }
      } : null
      const response = await axios.get(url, { headers })
      const $ = cheerio.load(response.data)

      this.image = $('meta[property="og:image"]').first()
      this.chapterDate = $('.date').first()

      if (mobile || Platform.is?.mobile === true) {
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
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return this.addToQueue(async () => {
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
          if (!title.toLowerCase().includes(query.toLowerCase())) continue
          const url = `${this.getUrl()}/episodeList?titleNo=${item[3][0]}`
          promises.push(this.readUrl(url))
        }
      }

      const mangaList = await Promise.all(promises)
      return mangaList.filter(manga => manga instanceof Manga) as Manga[]
    })
  }
}

interface WebtoonsSearch {
  query: Array<string>;
  items: Array<Array<Array<Array<string>>>>
}
