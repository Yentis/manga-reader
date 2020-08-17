import { Manga } from '../manga'
import { SiteType } from '../siteType'
import { BaseSite } from './baseSite'

export class WordPress extends BaseSite {
    site: SiteType;

    constructor (chapter: Element | undefined, image: Element | undefined, title: Element | undefined, site: SiteType) {
      super(chapter, image, title)
      this.site = site
    }

    getImage (): string {
      if (!this.image) return ''
      const image = this.image as HTMLImageElement

      if (image.src.startsWith('https://')) {
        return image.src
      } else {
        return image.getAttribute('data-lazy-src') || image.getAttribute('data-cfsrc') || ''
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
