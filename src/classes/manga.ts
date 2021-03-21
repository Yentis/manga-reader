import { LinkingSiteType } from '../enums/linkingSiteEnum'
import { Status } from '../enums/statusEnum'
import { SiteType } from '../enums/siteEnum'

export class Manga {
    url: string
    site: SiteType | LinkingSiteType
    chapter = 'Unknown'
    chapterNum = 0
    image = ''
    title = ''
    chapterUrl = ''
    chapterDate = ''
    read: string | undefined
    readNum: number | undefined
    readUrl: string | undefined
    linkedSites: Record<string, number>
    status: Status
    notes: string | undefined
    rating: number | undefined

    constructor (url: string, site: SiteType | LinkingSiteType) {
      this.url = url
      this.site = site
      this.linkedSites = {}
      this.status = Status.READING
    }
}
