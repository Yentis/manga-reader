import { SiteType } from '../../enums/siteEnum'
import { BaseData, BaseSite } from './baseSite'
import PQueue from 'p-queue'
import { requestHandler } from 'src/services/requestService'
import { ContentType } from 'src/enums/contentTypeEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { Manga } from 'src/classes/manga'
import qs from 'qs'
import moment from 'moment'
import { getDateFromNow, parseHtmlFromString, titleContainsQuery } from 'src/utils/siteUtils'

class WordPressData extends BaseData {
  volume?: Element
  volumeList?: Element[]
}

export class WordPress extends BaseSite {
  siteType: SiteType;

  constructor (siteType: SiteType) {
    super()
    this.siteType = siteType

    if (siteType === SiteType.HiperDEX) {
      this.requestQueue = new PQueue({ interval: 1000, intervalCap: 1 })
    }
  }

  getChapter (data: WordPressData): string {
    const volume = data.volume?.textContent?.trim() || 'Vol.01'
    const chapterDate = data.chapterDate?.textContent?.trim() || ''
    const chapter = data.chapter?.textContent?.replace(chapterDate, '').trim()

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
    if (data.volumeList?.length === 0) return this.getSimpleChapterNum(this.getChapter(data))
    let chapterNum = 0

    data.volumeList?.forEach((element, index) => {
      const chapterElement = element.querySelectorAll('.wp-manga-chapter a')[0]
      const chapterText = chapterElement?.textContent?.trim()
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

  private getSimpleChapterNum (chapter: string | undefined): number {
    if (!chapter) return 0

    const pattern = /[\d\\.,]+\b/gm
    let num = 0
    let match: RegExpExecArray | null

    while ((match = pattern.exec(chapter)) !== null) {
      const matchedValue = match[0]
      if (!matchedValue) continue

      const parsedMatch = parseFloat(matchedValue)
      if (!isNaN(parsedMatch)) {
        num = parsedMatch
        break
      }
    }

    if (num === 0) {
      const chapterNum = chapter.split(' ')[0]
      if (!chapterNum) return num

      const candidateNum = parseFloat(chapterNum)
      if (!isNaN(candidateNum)) num = candidateNum
    }

    return num
  }

  getChapterDate (data: BaseData): string {
    const chapterDateText = data.chapterDate?.textContent?.trim()

    let format
    if (chapterDateText?.includes('/')) {
      format = 'DD/MM/YYYY'
    } else if (chapterDateText?.includes(',')) {
      format = 'MMMM DD, YYYY'
    } else {
      format = 'Do MMMM YYYY'
    }

    const chapterDate = moment(chapterDateText, format)
    if (!chapterDateText?.endsWith('ago') && chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return getDateFromNow(data.chapterDate?.textContent) || getDateFromNow(data.chapterDate?.querySelectorAll('a')[0]?.getAttribute('title'))
    }
  }

  getImage (data: BaseData): string {
    return this.getImageSrc(data.image)
  }

  getTitle (data: BaseData): string {
    const spanText = data.title?.querySelectorAll('span')[0]?.textContent || ''
    return data.title?.textContent?.replace(spanText, '').trim() || ''
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    let data = new WordPressData(url)
    data = this.setVolume(doc, data)
    data = this.setChapter(doc, data)

    if (!data.chapter?.innerHTML || !data.chapterDate?.innerHTML) {
      const mangaId = doc.querySelectorAll('#manga-chapters-holder')[0]?.getAttribute('data-id') || ''

      let result = await this.readChapters(mangaId, data, `${this.getUrl()}/wp-admin/admin-ajax.php`)

      if (result instanceof Error) {
        const baseUrl = data.url.endsWith('/') ? data.url : `${data.url}/`
        const actualUrl = doc.querySelectorAll('meta[property="og:url"]')[0]?.getAttribute('content') || baseUrl
        result = await this.readChapters(mangaId, data, `${actualUrl}ajax/chapters`)
      }

      if (result instanceof Error) return result
      data = result
    }

    const summaryImage = doc.querySelectorAll('.summary_image img')
    if (summaryImage.length > 0) {
      data.image = summaryImage[0]
    } else {
      data.image = doc.querySelectorAll('meta[property="og:image"]')[0]
    }
    data.title = doc.querySelectorAll('.post-title')[0]

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    let queryParam = ''
    query.split(' ').forEach((word, index) => {
      if (index > 0) { queryParam += '+' }
      queryParam += word
    })

    const queryString = qs.stringify({
      s: queryParam,
      post_type: 'wp-manga'
    })
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    const mangaList: Manga[] = []

    doc.querySelectorAll('.c-tabs-item__content').forEach((elem) => {
      const imageElem = elem.querySelectorAll('a')[0]
      const manga = new Manga(imageElem?.getAttribute('href') || '', this.siteType)

      manga.image = this.getImageSrc(imageElem?.querySelectorAll('img')[0])
      manga.title = elem.querySelectorAll('.post-title')[0]?.textContent?.trim() || ''
      manga.chapter = elem.querySelectorAll('.font-meta.chapter')[0]?.textContent || 'Unknown'

      if (titleContainsQuery(query, manga.title)) {
        mangaList.push(manga)
      }
    })

    return mangaList
  }

  private async readChapters (mangaId: string, data: WordPressData, chapterPath: string): Promise<WordPressData | Error> {
    const parser = new DOMParser()
    let doc: Document

    const requestData = {
      action: 'manga_get_chapters',
      manga: mangaId
    }

    try {
      const request: HttpRequest = {
        method: 'POST',
        url: chapterPath,
        data: JSON.stringify(requestData),
        headers: { 'Content-Type': ContentType.URLENCODED }
      }
      const response = await requestHandler.sendRequest(request)
      if (response.data === '0') throw Error('Invalid chapter data')

      doc = await parseHtmlFromString(response.data, parser)
    } catch (error) {
      return error instanceof Error ? error : Error(error as string)
    }

    let newData = this.setVolume(doc, data)
    newData = this.setChapter(doc, newData)

    return newData
  }

  private setVolume (doc: Document, data: WordPressData): WordPressData {
    const volumes = doc.querySelectorAll('.parent.has-child .has-child')
    let volume: { element: Element, number: number } | undefined

    volumes.forEach((element) => {
      const text = element.textContent?.trim()
      if (!text) return

      const number = parseInt(text.replace(/\D/g, ''))
      if (isNaN(number)) return

      if (!volume || volume.number < number) {
        volume = { element, number }
      }
    })

    data.volume = volume?.element
    return data
  }

  private setChapter (doc: Document, data: WordPressData): WordPressData {
    const chapterSelector = '.wp-manga-chapter a'
    const chapterDateSelector = '.chapter-release-date'

    if (data.volume) {
      const volumeParent = data.volume.parentElement
      data.chapter = volumeParent?.querySelectorAll(chapterSelector)[0]
      data.chapterDate = volumeParent?.querySelectorAll(chapterDateSelector)[0]
      if (volumeParent) data.volumeList = [volumeParent]

      return data
    }

    data.chapter = doc.querySelectorAll(chapterSelector)[0]
    data.chapterDate = doc.querySelectorAll(chapterDateSelector)[0]
    data.volumeList = Array.from(doc.querySelectorAll('.parent.has-child'))

    return data
  }

  private getImageSrc (elem: Element | undefined) {
    let url = elem?.getAttribute('content') || elem?.getAttribute('data-src') || elem?.getAttribute('data-lazy-src') || elem?.getAttribute('data-cfsrc') || elem?.getAttribute('src') || ''
    if (url.startsWith('//')) url = `https:${url}`

    return url
  }

  getLoginUrl (): string {
    return this.getUrl()
  }

  getTestUrl (): string {
    switch (this.siteType) {
      case SiteType.FirstKissManga:
        return `${this.getUrl()}/manga/ripples-of-love/`
      case SiteType.MangaKomi:
        return `${this.getUrl()}/manga/good-night/`
      case SiteType.HiperDEX:
        return `${this.getUrl()}/manga/arata-primal-the-new-primitive/`
      case SiteType.MangaTx:
        return `${this.getUrl()}/manga/grandest-wedding/`
      case SiteType.LeviatanScans:
        return `${this.getUrl()}/manga/the-throne/`
      case SiteType.SleepingKnightScans:
        return `${this.getUrl()}/manga/chronicles-of-heavenly-demon/`
      case SiteType.ReaperScans:
        return `${this.getUrl()}/series/aire/`
      case SiteType.ResetScans:
        return `${this.getUrl()}/manga/madou-no-keifu/`
    }

    return this.getUrl()
  }
}
