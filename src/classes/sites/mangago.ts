import moment from 'moment'
import qs from 'qs'
import { Platform } from 'src/enums/platformEnum'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { getPlatform } from 'src/services/platformService'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, parseNum, titleContainsQuery } from 'src/utils/siteUtils'
import { Manga } from '../manga'
import { BaseData, BaseSite } from './baseSite'

export class Mangago extends BaseSite {
  siteType = SiteType.Mangago

  getChapter (data: BaseData): string {
    return data.chapter?.textContent?.trim() || 'Unknown'
  }

  getChapterUrl (data: BaseData): string {
    return data.chapter?.getAttribute('href') || ''
  }

  getChapterNum (data: BaseData): number {
    return parseNum(data.chapterNum?.textContent?.split('Ch.')[1])
  }

  getChapterDate (data: BaseData): string {
    const chapterDateText = data.chapterDate?.textContent?.trim()
    if (!chapterDateText) return ''

    const chapterDate = moment(chapterDateText, 'MMM DD, YYYY')
    if (chapterDate.isValid()) {
      return chapterDate.fromNow()
    } else {
      return ''
    }
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)
    const data = new BaseData(url)

    if (getPlatform() !== Platform.Cordova) {
      const listingElem = doc.querySelectorAll('.listing tbody tr')[0]

      data.chapter = listingElem?.querySelectorAll('a')[0]
      data.chapterNum = data.chapter

      const listingElemChildren = listingElem?.children
      data.chapterDate = listingElemChildren?.item(listingElemChildren.length - 1)

      data.image = doc.querySelectorAll('.cover img')[0]
      data.title = doc.querySelectorAll('.w-title h1')[0]

      return this.buildManga(data)
    }

    const columnElem = doc.querySelectorAll('.uk-table tr')[0]
    data.chapter = columnElem?.querySelectorAll('.chico')[0]
    data.chapterNum = data.chapter

    const columnElemChildren = columnElem?.children
    data.chapterDate = columnElemChildren?.item(columnElemChildren.length - 1)

    data.image = doc.querySelectorAll('.uk-container img')[0]
    data.title = doc.querySelectorAll('.uk-h1')[0]

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({
      name: query
    })

    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/r/l_search/?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)
    const mangaList: Manga[] = []

    const missingChapterUrls: string[] = []
    const promises: Promise<Error | Manga>[] = []

    doc.querySelectorAll('#search_list li').forEach((element) => {
      const manga = new Manga('', this.siteType)
      const titleElem = element.querySelectorAll('.tit a')
      manga.title = titleElem[0]?.textContent?.trim() || ''

      if (!titleContainsQuery(query, manga.title)) return
      manga.chapter = element.querySelectorAll('.chico')[0]?.textContent?.trim() || 'Unknown'
      manga.url = titleElem[0]?.getAttribute('href') || ''

      // Some chapters aren't listed on the search results page
      if (manga.chapter === 'Unknown') {
        missingChapterUrls.push(manga.url)
      } else {
        manga.image = element.querySelectorAll('.left img')[0]?.getAttribute('src') || ''

        mangaList.push(manga)
      }
    })

    missingChapterUrls.forEach((url) => {
      promises.push(this.readUrl(url))
    })

    const missingMangaList = await Promise.all(promises)
    return mangaList.concat(missingMangaList.filter(manga => manga instanceof Manga) as Manga[])
  }

  getUrl (): string {
    return `https://www.${this.siteType}`
  }

  getLoginUrl (): string {
    return `${this.getUrl()}/home/accounts/login/`
  }

  getTestUrl (): string {
    return `${this.getUrl()}/read-manga/curtain/`
  }
}
