import qs from 'qs'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString, parseNum, titleContainsQuery } from 'src/utils/siteUtils'
import { SiteType } from '../../enums/siteEnum'
import { Manga } from '../manga'
import { BaseData, BaseSite } from './baseSite'

class GenkanData extends BaseData {
  volume?: Element
  volumeList?: Element[]
}

export class Genkan extends BaseSite {
  siteType: SiteType

  constructor (siteType: SiteType) {
    super()
    this.siteType = siteType
  }

  getChapter (data: GenkanData): string {
    const volume = data.volume?.textContent?.trim() || 'Volume 1'
    const chapter = data.chapter?.textContent?.trim()

    if (!volume.endsWith(' 1') && chapter) {
      return `${volume} ${chapter}`
    } else if (chapter) {
      return chapter
    } else if (volume) {
      return volume
    } else {
      return 'Unknown'
    }
  }

  getChapterNum (data: GenkanData): number {
    if (data.volumeList?.length === 0) return 0
    let chapterNum = 0

    data.volumeList?.forEach((element) => {
      const chapterElement = element.querySelectorAll('.list-item.col-sm-3 span')[0]
      const chapterOfVolume = parseNum(chapterElement?.textContent?.trim())

      chapterNum += chapterOfVolume
    })

    return chapterNum
  }

  getImage (data: BaseData): string {
    if (!(data.image instanceof HTMLElement)) return ''
    const backgroundImage = data.image.style.backgroundImage
    let replaceText = this.getUrl()

    if (backgroundImage && backgroundImage.includes('https://')) {
      replaceText = ''
    }

    return data.image.style.backgroundImage.replace(/url\("?/g, replaceText)?.replace(/"?\)/g, '') || ''
  }

  protected async readUrlImpl (url: string): Promise<Error | Manga> {
    const request: HttpRequest = { method: 'GET', url }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)

    const data = new GenkanData(url)
    const chapterElem = doc.querySelectorAll('.list-item.col-sm-3 a')
    data.volume = doc.querySelectorAll('h6.text-highlight')[1]
    data.chapter = chapterElem[0]
    data.chapterDate = chapterElem[1]
    data.volumeList = Array.from(doc.querySelectorAll('.row.py-2'))

    data.image = doc.querySelectorAll('.media-content')[0]
    data.title = doc.querySelectorAll('.text-highlight')[0]

    return this.buildManga(data)
  }

  protected async searchImpl (query: string): Promise<Error | Manga[]> {
    const queryString = qs.stringify({ query })
    const request: HttpRequest = { method: 'GET', url: `${this.getUrl()}/comics?${queryString}` }
    const response = await requestHandler.sendRequest(request)
    const doc = await parseHtmlFromString(response.data)
    const promises: Promise<Error | Manga>[] = []

    if (this.siteType === SiteType.MethodScans) {
      doc.querySelectorAll('.list-item.rounded').forEach((elem) => {
        const titleElem = elem.querySelectorAll('.list-body a')[0]
        const title = titleElem?.innerHTML || ''
        const url = titleElem?.getAttribute('href') || ''

        if (titleContainsQuery(query, title) && url) {
          promises.push(this.readUrl(url))
        }
      })
    } else {
      doc.querySelectorAll('.list-item.rounded').forEach((elem) => {
        const url = elem.querySelectorAll('.media-content')[0]?.getAttribute('href') || ''
        const title = elem.querySelectorAll('.list-body a')[0]?.innerHTML || ''

        if (titleContainsQuery(query, title) && url) {
          promises.push(this.readUrl(url))
        }
      })
    }

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }

  getTestUrl () : string {
    switch (this.siteType) {
      case SiteType.HatigarmScans:
        return `${this.getUrl()}/comics/848996-ichizu-de-bitch-na-kouhai`
      case SiteType.MethodScans:
        return `${this.getUrl()}/comics/773532-meng-shi-zai-shang`
      case SiteType.ZeroScans:
        return `${this.getUrl()}/comics/136750-all-heavenly-days`
      case SiteType.LynxScans:
        return `${this.getUrl()}/comics/698439-dawn-of-the-eastland`
    }

    return this.getUrl()
  }
}
