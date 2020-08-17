import { Manga } from '../manga'
import { SiteType } from '../siteType'
import { BaseSite } from './baseSite'

export class MangaDex extends BaseSite {
  getChapter (): string {
    return this.chapter?.textContent ? this.chapter.textContent.replace(/ +(?= )/g, '') : 'Unknown'
  }

  getChapterUrl (): string {
    if (!this.chapter) return ''

    const chapter = this.chapter as HTMLAnchorElement
    if (!chapter.href.startsWith('https://')) {
      return chapter.href ? 'https://' + SiteType.MangaDex + chapter.href : ''
    } else {
      return chapter.href ? chapter.href : ''
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
