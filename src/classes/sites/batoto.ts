import { Manga } from 'src/classes/manga'
import { SiteType } from 'src/enums/siteEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, parseNum, titleContainsQuery } from 'src/utils/siteUtils'
import { BaseData, BaseSite } from './baseSite'

export class Batoto extends BaseSite {
  siteType = SiteType.Batoto

  getChapterNum (data: BaseData): number {
    return parseNum(data.chapterNum?.textContent?.trim().split(' ')[1])
  }

  getImage (data: BaseData): string {
    return data.image?.getAttribute('content') || ''
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)

    const doc = await parseHtmlFromString(response.data)

    const data = new BaseData(url)
    data.chapter = doc.querySelectorAll('.chapt')[0]
    const episodeListChildren = doc.querySelectorAll('.episode-list .extra')[0]?.children
    data.chapterDate = episodeListChildren?.item(episodeListChildren.length - 1)
    data.chapterNum = data.chapter
    data.image = doc.querySelectorAll('meta[property="og:image"]')[0]
    data.title = doc.querySelectorAll('.item-title')[0]

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/search?word=${encodeURIComponent(query)}` }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)
    const mangaList: Manga[] = []

    doc.querySelectorAll('#series-list .item').forEach((elem) => {
      const titleElem = elem.querySelectorAll('.item-text a')[0]
      const url = titleElem?.getAttribute('href')

      const manga = new Manga('', this.siteType)
      manga.title = titleElem?.textContent?.trim() || ''

      const image = elem.querySelectorAll('img')[0]
      const imageUrl = image?.getAttribute('data-cfsrc') || image?.getAttribute('src') || ''
      manga.image = imageUrl

      manga.chapter = elem.querySelectorAll('.item-volch a')[0]?.textContent?.trim() || 'Unknown'
      manga.url = url ? `${this.getUrl()}${url}` : ''

      if (titleContainsQuery(query, manga.title)) {
        mangaList.push(manga)
      }
    })

    return mangaList
  }

  getTestUrl (): string {
    return `${this.getUrl()}/series/72315/doctor-elise-the-royal-lady-with-the-lamp`
  }
}
