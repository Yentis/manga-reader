import { Manga } from '../manga'
import { SiteType } from '../siteType'
import { BaseSite } from './baseSite'

export class WebToons extends BaseSite {
    chapterUrl: Cheerio | undefined;

    constructor (chapter: Cheerio | undefined, chapterUrl: Cheerio | undefined, image: Cheerio | undefined, title: Cheerio | undefined) {
      super(chapter, image, title)
      this.chapterUrl = chapterUrl
    }

    getChapterUrl (): string {
      return this.chapterUrl?.attr('href') || ''
    }

    getImage (): string {
      return this.image?.attr('content') || ''
    }

    buildManga (url: string): Manga {
      const manga = new Manga(url, SiteType.WebToons)
      manga.chapter = this.getChapter()
      manga.chapterUrl = this.getChapterUrl()
      manga.image = this.getImage()
      manga.title = this.getTitle()

      return manga
    }
}
