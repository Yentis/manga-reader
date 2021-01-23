import { SiteType } from '../../../enums/siteEnum'
import { BaseWorker } from '../baseWorker'
import moment from 'moment'
import { Manga } from '../../manga'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio from 'cheerio'
import qs from 'qs'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'

export class WordPressWorker extends BaseWorker {
  static getUrl (siteType: SiteType | LinkingSiteType): string {
    if (siteType === SiteType.MangaDoDs) {
      return `${BaseWorker.urlPrefix}https://www.${siteType}`
    } else {
      return `${BaseWorker.urlPrefix}https://${siteType}`
    }
  }

  static getTestUrl (siteType: SiteType): string {
    switch (siteType) {
      case SiteType.FirstKissManga:
        return `${WordPressWorker.getUrl(siteType)}/manga/ripples-of-love/`
      case SiteType.MangaKomi:
        return `${WordPressWorker.getUrl(siteType)}/manga/good-night/`
      case SiteType.HiperDEX:
        return `${WordPressWorker.getUrl(siteType)}/manga/arata-primal-the-new-primitive/`
      case SiteType.MangaDoDs:
        return `${WordPressWorker.getUrl(siteType)}/manga/a-fairytale-for-the-demon-lord/`
      case SiteType.ManhwaClub:
        return `${WordPressWorker.getUrl(siteType)}/manhwa/settia/`
      case SiteType.MangaTx:
        return `${WordPressWorker.getUrl(siteType)}/manga/grandest-wedding/`
    }

    return WordPressWorker.getUrl(siteType)
  }

  volume: cheerio.Cheerio | undefined

  getChapter (): string {
    const volume = this.volume?.text().trim() || 'Vol.01'
    const chapter = this.chapter?.text().trim()

    if (!volume.endsWith('.01') && !volume.endsWith(' 1') && chapter) {
      return `${volume} ${chapter}`
    } else if (chapter) {
      return chapter
    } else if (volume) {
      return volume
    } else {
      return 'Unknown'
    }
  }

  getChapterNum (): number {
    if (!this.chapterNum) return this.getSimpleChapterNum(this.getChapter())
    const html = this.chapterNum?.html()
    if (!html) return this.getSimpleChapterNum(this.getChapter())
    const $ = cheerio.load(html)

    let chapterNum = 0

    this.chapterNum.each((index, element) => {
      const chapterElement = $(element).find('.wp-manga-chapter a').first()
      const chapterText = chapterElement.text().trim()
      const chapterOfVolume = this.getSimpleChapterNum(chapterText)

      // We only want decimal places if this is the current chapter, otherwise just add the floored volume number
      if (index === 0) {
        chapterNum += chapterOfVolume
      } else {
        chapterNum += Math.floor(chapterOfVolume)
      }
    })

    return chapterNum
  }

  private getSimpleChapterNum (chapter: string): number {
    const matches = /Chapter ([-+]?[0-9]*\.?[0-9]+)/gm.exec(chapter) || /Ch.([-+]?[0-9]*\.?[0-9]+)/gm.exec(chapter) || []
    let num = 0

    for (const match of matches) {
      const parsedMatch = parseFloat(match)
      if (!isNaN(parsedMatch)) num = parsedMatch
    }

    if (num === 0) {
      const candidateNum = parseFloat(chapter.split(' ')[0])
      if (!isNaN(candidateNum)) num = candidateNum
    }

    return num
  }

  getChapterDate (): string {
    let format

    switch (this.siteType) {
      case SiteType.FirstKissManga:
        format = 'Do MMMM YYYY'
        break
      case SiteType.MangaDoDs:
        format = 'YYYY-MM-DD'
        break
      default:
        format = 'MMMM DD, YYYY'
        break
    }

    const chapterDateText = this.chapterDate?.text().trim()
    const chapterDate = moment(chapterDateText, format)
    if (!chapterDateText?.endsWith('ago') && chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return this.getDateFromNow(this.chapterDate?.text()) || this.getDateFromNow(this.chapterDate?.find('a').attr('title'))
    }
  }

  getImage (): string {
    return this.getImageSrc(this.image)
  }

  getTitle (): string {
    return this.title?.text().replace(this.title.find('span').text(), '').trim() || 'Unknown'
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    this.volume = $('.parent.has-child a').first()
    this.chapter = $('.wp-manga-chapter a').first()
    this.chapterDate = $('.chapter-release-date').first()
    this.chapterNum = $('.parent.has-child')
    if (!this.chapter.html() || !this.chapterDate.html()) {
      const mangaId = $('.rating-post-id').first().attr('value') || ''
      const error = await this.readChapters(mangaId)

      if (error) return error
    }
    this.image = $('.summary_image img').first()
    this.title = $('.post-title').first()

    return this.buildManga(url)
  }

  async search (query: string): Promise<Error | Manga[]> {
    let queryString = ''
    query.split(' ').forEach((word, index) => {
      if (index > 0) {
        queryString = queryString + '+'
      }
      queryString = queryString + word
    })
    const response = await axios({
      method: 'get',
      url: `${WordPressWorker.getUrl(this.siteType)}?s=${queryString}&post_type=wp-manga`
    })
    const $ = cheerio.load(response.data)

    const mangaList: Manga[] = []

    $('.c-tabs-item__content').each((_index, elem) => {
      const cheerioElem = $(elem)
      const imageElem = cheerioElem.find('a').first()
      const manga = new Manga(imageElem.attr('href') || '', this.siteType)

      manga.image = this.getImageSrc(imageElem.find('img').first())
      manga.title = cheerioElem.find('.post-title').first().text().trim()
      manga.chapter = cheerioElem.find('.font-meta.chapter').first().text()

      if (this.titleContainsQuery(query, manga.title)) {
        mangaList.push(manga)
      }
    })

    return mangaList
  }

  private async readChapters (mangaId: string): Promise<void | Error> {
    const data = qs.stringify({
      action: 'manga_get_chapters',
      manga: mangaId
    })

    const config: AxiosRequestConfig = {
      method: 'post',
      url: `${WordPressWorker.getUrl(this.siteType)}/wp-admin/admin-ajax.php`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data
    }

    const response = await axios(config)
    const $ = cheerio.load(response.data)
    this.chapter = $('.wp-manga-chapter a').first()
    this.chapterDate = $('.chapter-release-date').first()
  }

  private getImageSrc (elem: cheerio.Cheerio | undefined) {
    return elem?.attr('data-src') || elem?.attr('data-lazy-src') || elem?.attr('data-cfsrc') || elem?.attr('src') || ''
  }
}
