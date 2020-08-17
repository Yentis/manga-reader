import { Manga } from '../manga'

export abstract class BaseSite {
    chapter: Element | undefined;
    image: Element | undefined;
    title: Element | undefined;

    constructor (chapter: Element | undefined, image: Element | undefined, title: Element | undefined) {
      this.chapter = chapter
      this.image = image
      this.title = title
    }

    getChapter (): string {
      return this.chapter?.textContent ? this.chapter.textContent.trim() : 'Unknown'
    }

    getChapterUrl (): string {
      if (!this.chapter) return ''

      const chapter = this.chapter as HTMLAnchorElement
      return chapter.href ? chapter.href : ''
    }

    getImage (): string {
      if (!this.image) return ''

      const image = this.image as HTMLImageElement
      return image.src ? image.src : ''
    }

    getTitle (): string {
      return this.title?.textContent ? this.title.textContent.trim() : 'Unknown'
    }

    abstract buildManga(url: string): Manga;
}
