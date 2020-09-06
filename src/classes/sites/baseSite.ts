import { Manga } from '../manga'
import { SiteType } from '../../enums/siteEnum'
import moment from 'moment'

export abstract class BaseSite {
    abstract siteType: SiteType

    chapter: Cheerio | undefined
    image: Cheerio | undefined
    title: Cheerio | undefined
    chapterDate: Cheerio | undefined
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

    getChapterDate (): string {
      return this.getDateFromNow(this.chapterDate?.text())
    }

    getDateFromNow (input: string | undefined): string {
      const date = moment()
      const chapterDate = input?.trim().split(' ') || []
      let amount = -1

      if (chapterDate[0]) {
        amount = parseInt(chapterDate[0]) || -1
      }

      if (amount !== -1 && chapterDate[1]) {
        const durationUnit = chapterDate[1]
        if (durationUnit.startsWith('sec')) {
          date.subtract(amount, 'second')
        } else if (durationUnit.startsWith('min')) {
          date.subtract(amount, 'minute')
        } else if (durationUnit.startsWith('hour')) {
          date.subtract(amount, 'hour')
        } else if (durationUnit.startsWith('day')) {
          date.subtract(amount, 'day')
        } else if (durationUnit.startsWith('week')) {
          date.subtract(amount, 'week')
        } else if (durationUnit.startsWith('month')) {
          date.subtract(amount, 'month')
        } else if (durationUnit.startsWith('year')) {
          date.subtract(amount, 'year')
        }

        return date.fromNow()
      }

      return ''
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
      manga.chapterDate = this.getChapterDate()

      return manga
    }

    abstract readUrl(url: string): Promise<Error | Manga>
    abstract search(query: string): Promise<Error | Manga[]>
}
