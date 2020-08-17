import { Manga } from '../manga'
import { SiteType } from '../siteType'
import { BaseSite } from './baseSite'

export class MangaKakalot extends BaseSite {
  buildManga (url: string): Manga {
    const manga = new Manga(url, SiteType.MangaKakalot)
    manga.chapter = this.getChapter()
    manga.chapterUrl = this.getChapterUrl()
    manga.image = this.getImage()
    manga.title = this.getTitle()

    return manga
  }
}
