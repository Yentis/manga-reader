import { BaseWorker } from '../baseWorker'
import { Manga } from '../../manga'
import axios from 'axios'
import { SiteType } from '../../../enums/siteEnum'
import { LinkingSiteType } from '../../../enums/linkingSiteEnum'
import cheerio, { Cheerio, Element } from 'cheerio'

export class GenkanWorker extends BaseWorker {
  static getUrl (siteType: SiteType | LinkingSiteType): string {
    return BaseWorker.getUrl(siteType)
  }

  static getTestUrl (siteType: SiteType | LinkingSiteType) : string {
    switch (siteType) {
      case SiteType.HatigarmScans:
        return `${GenkanWorker.getUrl(siteType)}/comics/848996-ichizu-de-bitch-na-kouhai`
      case SiteType.MethodScans:
        return `${GenkanWorker.getUrl(siteType)}/comics/773532-meng-shi-zai-shang`
      case SiteType.ZeroScans:
        return `${GenkanWorker.getUrl(siteType)}/comics/136750-all-heavenly-days`
      case SiteType.LynxScans:
        return `${GenkanWorker.getUrl(siteType)}/comics/698439-dawn-of-the-eastland`
      case SiteType.EdelgardeScans:
        return `${GenkanWorker.getUrl(siteType)}/comics/713627-i-stack-experience-through-writing-books`
    }

    return GenkanWorker.getUrl(siteType)
  }

  volume?: Cheerio<Element>

  getChapter (): string {
    const volume = this.volume?.text().trim() || 'Volume 1'
    const chapter = this.chapter?.text().trim()

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

  getChapterNum (): number {
    if (!this.chapterNum) return 0
    const html = this.chapterNum?.html()
    if (!html) return 0
    const $ = cheerio.load(html)

    let chapterNum = 0

    this.chapterNum.each((_index, element) => {
      const chapterElement = $(element).find('.list-item.col-sm-3 span').first()
      const chapterOfVolume = this.parseNum(chapterElement?.text().trim())

      chapterNum += chapterOfVolume
    })

    return chapterNum
  }

  getImage (): string {
    const backgroundImage = this.image?.css('background-image')
    let replaceText = GenkanWorker.getUrl(this.siteType)

    if (backgroundImage && backgroundImage.includes('https://')) {
      replaceText = ''
    }

    return this.image?.css('background-image')?.replace(/url\("?/g, replaceText)?.replace(/"?\)/g, '') || ''
  }

  async readUrl (url: string): Promise<Error | Manga> {
    const response = await axios.get(url)
    const $ = cheerio.load(response.data)

    const chapterElem = $('.list-item.col-sm-3 a')
    this.volume = $('h6.text-highlight').eq(1)
    this.chapter = chapterElem.first()
    this.chapterDate = chapterElem.eq(1)
    this.chapterNum = $('.row.py-2')
    this.image = $('.media-content').first()
    this.title = $('.text-highlight').first()

    return this.buildManga(url)
  }

  async search (query: string): Promise<Error | Manga[]> {
    const response = await axios.get(`${GenkanWorker.getUrl(this.siteType)}/comics`, {
      params: {
        query
      }
    })
    const $ = cheerio.load(response.data)
    const promises: Promise<Error | Manga>[] = []

    if (this.siteType === SiteType.MethodScans) {
      $('.list-item.rounded').each((_index, elem) => {
        const titleElem = $(elem).find('.list-body a').first()
        const title = titleElem.html() || ''
        const url = titleElem.attr('href') || ''

        if (this.titleContainsQuery(query, title) && url) {
          promises.push(this.readUrl(url))
        }
      })
    } else {
      $('.list-item.rounded').each((_index, elem) => {
        const url = $(elem).find('.media-content').first().attr('href') || ''
        const title = $(elem).find('.list-body a').first().html() || ''

        if (this.titleContainsQuery(query, title) && url) {
          promises.push(this.readUrl(url))
        }
      })
    }

    const mangaList = await Promise.all(promises)
    return mangaList.filter(manga => manga instanceof Manga) as Manga[]
  }
}
