import { Manga } from '../manga'
import { SiteType } from '../siteType'
import { BaseSite } from './baseSite'

export class WordPress extends BaseSite {
    site: SiteType;

    constructor (chapter: Cheerio | undefined, image: Cheerio | undefined, title: Cheerio | undefined, site: SiteType) {
      super(chapter, image, title)
      this.site = site
    }

    getImage (): string {
      if (this.image?.attr('src')?.startsWith('https://')) {
        return this.image.attr('src') || ''
      } else {
        return this.image?.attr('data-lazy-src') || this.image?.attr('data-cfsrc') || ''
      }
    }

    buildManga (url: string): Manga {
      const manga = new Manga(url, this.site)
      manga.chapter = this.getChapter()
      manga.chapterUrl = this.getChapterUrl()
      manga.image = this.getImage()
      manga.title = this.getTitle()

      return manga
    }
}
