import { Manga } from '../manga'
import { SiteType } from '../siteType'
import { BaseSite } from './baseSite'

export class Genkan extends BaseSite {
    site: SiteType;

    constructor (chapter: Element | undefined, image: Element | undefined, title: Element | undefined, site: SiteType) {
      super(chapter, image, title)
      this.site = site
    }

    getImage (): string {
      if (!this.image) return ''

      const image = this.image as HTMLAnchorElement
      return image.style?.backgroundImage ? image.style.backgroundImage.replace(new RegExp('url\\("?', 'g'), 'https://' + this.site).replace(new RegExp('"?\\)', 'g'), '') : ''
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
