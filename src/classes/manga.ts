import { SiteType } from '../enums/siteEnum'

export class Manga {
    url: string
    site: SiteType
    chapter = 'Unknown'
    chapterNum = 0
    image = ''
    title = 'Unknown'
    chapterUrl = ''
    chapterDate = ''
    read: string | undefined
    readUrl: string | undefined
    mangaDexId: number | undefined

    constructor (url: string, site: SiteType) {
      this.url = url
      this.site = site
    }
}
