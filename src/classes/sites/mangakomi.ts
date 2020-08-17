import { Manga } from '../manga'
import { SiteType } from '../siteType'
import { BaseSite } from './baseSite'

export class MangaKomi extends BaseSite {
  getImage (): string {
    if (this.image) {
      const attribute = this.image.getAttribute('data-lazy-src')
      return attribute || ''
    } else {
      return ''
    }
  }

  buildManga (url: string): Manga {
    const manga = new Manga(url, SiteType.FirstKissManga)
    manga.chapter = this.getChapter()
    manga.chapterUrl = this.getChapterUrl()
    manga.image = this.getImage()
    manga.title = this.getTitle()

    return manga
  }
}
