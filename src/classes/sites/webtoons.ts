import { Manga } from '../manga'
import { SiteType } from '../siteType'
import { BaseSite } from './baseSite'

export class WebToons extends BaseSite {
    chapterUrl: Element | undefined;

    constructor (chapter: Element | undefined, chapterUrl: Element | undefined, image: Element | undefined, title: Element | undefined) {
      super(chapter, image, title)
      this.chapterUrl = chapterUrl
    }

    getChapterUrl (): string {
      if (!this.chapterUrl) return ''

      const chapterUrl = this.chapterUrl as HTMLAnchorElement
      return chapterUrl.href ? chapterUrl.href : ''
    }

    getImage (): string {
      if (!this.image) return ''

      const image = this.image as HTMLMetaElement
      return image.content ? image.content : ''
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
