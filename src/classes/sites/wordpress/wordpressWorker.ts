import { SiteType } from '../../../enums/siteEnum'
import { BaseData, BaseWorker } from '../baseWorker'
import moment from 'moment'
import { Manga } from '../../manga'
import axios, { AxiosRequestConfig } from 'axios'
import cheerio, { Cheerio, CheerioAPI, Element } from 'cheerio'
import qs from 'qs'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { ContentType } from 'src/enums/contentTypeEnum'

class WordPressData extends BaseData {
  volume?: Cheerio<Element>
}

export class WordPressWorker extends BaseWorker {
  static getUrl (siteType: SiteType | LinkingSiteType): string {
    return `${BaseWorker.urlPrefix}https://${siteType}`
  }

  static getTestUrl (siteType: SiteType): string {
    switch (siteType) {
      case SiteType.FirstKissManga:
        return `${WordPressWorker.getUrl(siteType)}/manga/ripples-of-love/`
      case SiteType.MangaKomi:
        return `${WordPressWorker.getUrl(siteType)}/manga/good-night/`
      case SiteType.HiperDEX:
        return `${WordPressWorker.getUrl(siteType)}/manga/arata-primal-the-new-primitive/`
      case SiteType.MangaTx:
        return `${WordPressWorker.getUrl(siteType)}/manga/grandest-wedding/`
      case SiteType.LeviatanScans:
        return `${WordPressWorker.getUrl(siteType)}/manga/the-throne/`
      case SiteType.SleepingKnightScans:
        return `${WordPressWorker.getUrl(siteType)}/manga/chronicles-of-heavenly-demon/`
      case SiteType.ReaperScans:
        return `${WordPressWorker.getUrl(siteType)}/series/aire/`
      case SiteType.ResetScans:
        return `${WordPressWorker.getUrl(siteType)}/manga/madou-no-keifu/`
    }

    return WordPressWorker.getUrl(siteType)
  }

  getChapter (data: WordPressData): string {
    const volume = data.volume?.text().trim() || 'Vol.01'
    const chapterDate = data.chapterDate?.text().trim() || ''
    const chapter = data.chapter?.text().replace(chapterDate, '').trim()

    if (!volume.endsWith('.01') && !volume.endsWith(' 1') && chapter) {
      return `${volume} | ${chapter}`
    } else if (chapter) {
      return chapter
    } else if (volume) {
      return volume
    } else {
      return 'Unknown'
    }
  }

  getChapterNum (data: WordPressData): number {
    if (!data.chapterNum) return this.getSimpleChapterNum(this.getChapter(data))
    const html = data.chapterNum?.html()
    if (!html) return this.getSimpleChapterNum(this.getChapter(data))
    const $ = cheerio.load(html)

    let chapterNum = 0

    data.chapterNum.each((index, element) => {
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

  getChapterDate (data: BaseData): string {
    let format

    switch (this.siteType) {
      case SiteType.FirstKissManga:
        format = 'Do MMMM YYYY'
        break
      default:
        format = 'MMMM DD, YYYY'
        break
    }

    const chapterDateText = data.chapterDate?.text().trim()
    const chapterDate = moment(chapterDateText, format)
    if (!chapterDateText?.endsWith('ago') && chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return this.getDateFromNow(data.chapterDate?.text()) || this.getDateFromNow(data.chapterDate?.find('a').attr('title'))
    }
  }

  getImage (data: BaseData): string {
    return this.getImageSrc(data.image)
  }

  getTitle (data: BaseData): string {
    return data.title?.text().replace(data.title.find('span').text(), '').trim() || ''
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    let data = new WordPressData(url)
    data = this.setVolume($, data)
    data = this.setChapter($, data)

    if (!data.chapter?.html() || !data.chapterDate?.html()) {
      const mangaId = $('#manga-chapters-holder').first().attr('data-id') || ''
      let result = await this.readChapters(mangaId, data, `${WordPressWorker.getUrl(this.siteType)}/wp-admin/admin-ajax.php`)

      if (result instanceof Error) {
        const baseUrl = data.url.endsWith('/') ? data.url : `${data.url}/`
        result = await this.readChapters(mangaId, data, `${baseUrl}ajax/chapters`)
      }

      if (result instanceof Error) return result
      data = result
    }

    const summaryImage = $('.summary_image img')
    if (summaryImage.length > 0) {
      data.image = summaryImage.first()
    } else {
      data.image = $('meta[property="og:image"]').first()
    }
    data.title = $('.post-title').first()

    return this.buildManga(data)
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

  private async readChapters (mangaId: string, data: WordPressData, chapterPath: string): Promise<WordPressData | Error> {
    const queryString = qs.stringify({
      action: 'manga_get_chapters',
      manga: mangaId
    })

    const config: AxiosRequestConfig = {
      method: 'post',
      url: chapterPath,
      headers: {
        'Content-Type': ContentType.URLENCODED
      },
      data: queryString
    }

    let $: CheerioAPI
    try {
      const response = await axios(config)
      $ = cheerio.load(response.data)
    } catch (error) {
      return error instanceof Error ? error : Error(error)
    }

    let newData = this.setVolume($, data)
    newData = this.setChapter($, newData)

    return newData
  }

  private setVolume ($: CheerioAPI, data: WordPressData): WordPressData {
    const volumes = $('.parent.has-child .has-child')
    let volume: { element: Cheerio<Element>, number: number } | undefined

    volumes.each((_index, element) => {
      const cheerioElement = $(element)
      const text = cheerioElement.text().trim()
      const number = parseInt(text.replace(/\D/g, ''))
      if (isNaN(number)) return

      if (!volume || volume.number < number) {
        volume = { element: cheerioElement, number }
      }
    })

    data.volume = volume?.element
    return data
  }

  private setChapter ($: CheerioAPI, data: WordPressData): WordPressData {
    const chapterSelector = '.wp-manga-chapter a'
    const chapterDateSelector = '.chapter-release-date'

    if (data.volume) {
      const volumeParent = data.volume.parent()
      data.chapter = volumeParent.find(chapterSelector).first()
      data.chapterDate = volumeParent.find(chapterDateSelector).first()
      data.chapterNum = volumeParent

      return data
    }

    data.chapter = $(chapterSelector).first()
    data.chapterDate = $(chapterDateSelector).first()
    data.chapterNum = $('.parent.has-child')

    return data
  }

  private getImageSrc (elem: Cheerio<Element> | undefined) {
    let url = elem?.attr('content') || elem?.attr('data-src') || elem?.attr('data-lazy-src') || elem?.attr('data-cfsrc') || elem?.attr('src') || ''
    if (url.startsWith('//')) url = `https:${url}`

    return url
  }
}
