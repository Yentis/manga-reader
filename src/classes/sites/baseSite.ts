import { Manga } from '../manga'

export abstract class BaseSite {
    chapter: Cheerio | undefined;
    image: Cheerio | undefined;
    title: Cheerio | undefined;

    constructor (chapter: Cheerio | undefined, image: Cheerio | undefined, title: Cheerio | undefined) {
      this.chapter = chapter
      this.image = image
      this.title = title
    }

    getChapter (): string {
      return this.chapter?.text().trim() || 'Unknown'
    }

    getChapterUrl (): string {
      return this.chapter?.attr('href') || ''
    }

    getImage (): string {
      return this.image?.attr('src') || ''
    }

    getTitle (): string {
      return this.title?.text().trim() || 'Unknown'
    }

    abstract buildManga(url: string): Manga;
}
