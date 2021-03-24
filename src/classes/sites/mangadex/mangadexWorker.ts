import axios, { AxiosRequestConfig } from 'axios'
import { SiteType } from '../../../enums/siteEnum'
import { BaseWorker } from '../baseWorker'
import moment from 'moment'
import { Manga } from '../..//manga'
import cheerio from 'cheerio'
import relevancy from 'relevancy'

export class MangaDexWorker extends BaseWorker {
  static siteType = SiteType.MangaDex
  static url = BaseWorker.getUrl(MangaDexWorker.siteType)
  static testUrl = `${MangaDexWorker.url}/title/6272/jojo-s-bizarre-adventure-part-7-steel-ball-run-official-colored`

  constructor (requestConfig: AxiosRequestConfig | undefined = undefined) {
    super(MangaDexWorker.siteType, requestConfig)
  }

  async syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    if (chapterNum === 0) {
      return
    }

    const data = new FormData()
    data.append('volume', '0')
    data.append('chapter', chapterNum.toString())

    const response = await axios({
      method: 'post',
      url: `${MangaDexWorker.url}/ajax/actions.ajax.php?function=edit_progress&id=${mangaId}`,
      headers: {
        'x-requested-with': 'XMLHttpRequest'
      },
      data
    })

    if (response.data !== '') {
      return Error(response.data)
    }
  }

  getChapter (): string {
    return this.chapter?.text().replace(/ +(?= )/g, '') || 'Unknown'
  }

  getChapterNum (): number {
    return this.parseNum(this.chapterNum?.attr('data-chapter'))
  }

  getChapterUrl (): string {
    const href = this.chapter?.attr('href') || ''
    return this.processUrl(href)
  }

  getChapterDate (): string {
    const chapterDate = moment.utc(this.chapterDate?.attr('title'), 'YYYY-MM-DD hh:mm:ss')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    this.chapter = $('.chapter-row a').first()
    this.chapterNum = $('.chapter-row').eq(1)
    this.chapterDate = $('.chapter-row div[title]').first()
    this.image = $('.row img').first()
    this.title = $('.card-header .mx-1').first()

    return this.buildManga(url)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const config = this.requestConfig || {}
    config.params = {
      // Remove all special characters because
      // MangaDex search sucks and can't handle them
      title: query.replace(/[^\w ]/g, '')
    }

    const response = await axios.get(`${MangaDexWorker.url}/search`, config)
    const $ = cheerio.load(response.data)

    if ($('#login_button').length === 1) {
      return Error('Login required')
    }

    let candidateUrls: string[] = []
    const promises: Promise<Error | Manga>[] = []

    $('.ml-1.manga_title').each((_index, elem) => {
      if (this.titleContainsQuery(query, $(elem).text())) {
        const url = $(elem).attr('href') || ''
        candidateUrls.push(this.processUrl(url))
      }
    })
    candidateUrls = relevancy.sort(candidateUrls, query)

    for (let i = 0; i < Math.min(5, candidateUrls.length); i++) {
      promises.push(this.readUrl(candidateUrls[i]))
    }

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  private processUrl (url: string): string {
    if (url && !url.startsWith('https://')) {
      return MangaDexWorker.url + url.replace('file//', '') || ''
    } else {
      return url
    }
  }
}
