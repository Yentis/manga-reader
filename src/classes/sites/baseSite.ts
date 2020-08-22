import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'

export abstract class BaseSite {
    abstract siteType: SiteType

    chapter: Cheerio | undefined
    image: Cheerio | undefined
    title: Cheerio | undefined
    loggedIn = true

    canSearch (): boolean {
      return true
    }

    checkLogin (): void {
      // Do nothing
    }

    getUrl (): string {
      return `https://${this.siteType}`
    }

    getLoginUrl (): string {
      return `${this.getUrl()}/login`
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

    buildManga (url: string): Manga {
      const manga = new Manga(url, this.siteType)
      manga.chapter = this.getChapter()
      manga.chapterUrl = this.getChapterUrl()
      manga.image = this.getImage()
      manga.title = this.getTitle()

      return manga
    }

    abstract readUrl(url: string): Promise<Manga>
    abstract search(query: string): Promise<Error | Manga[]>
}
