import { Manga } from '../manga'
import { SiteType } from '../siteType'
import { BaseSite } from './baseSite'

export class MangaDex extends BaseSite {
  getChapter (): string {
    return this.chapter?.text().replace(/ +(?= )/g, '') || 'Unknown'
  }

  getChapterUrl (): string {
    const href = this.chapter?.attr('href') || ''
    if (href && !href.startsWith('https://')) {
      return 'https://' + SiteType.MangaDex + href.replace('file//', '') || ''
    } else {
      return href
    }
  }

  buildManga (url: string): Manga {
    const manga = new Manga(url, SiteType.MangaDex)
    manga.chapter = this.getChapter()
    manga.chapterUrl = this.getChapterUrl()
    manga.image = this.getImage()
    manga.title = this.getTitle()

    return manga
  }
}
