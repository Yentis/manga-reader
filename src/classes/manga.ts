import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { Status } from 'src/enums/statusEnum'
import { SiteType } from '../enums/siteEnum'

export class Manga {
    url: string
    site: SiteType | LinkingSiteType
    chapter = 'Unknown'
    chapterNum = 0
    image = ''
    title = 'Unknown'
    chapterUrl = ''
    chapterDate = ''
    read: string | undefined
    readNum: number | undefined
    readUrl: string | undefined
    linkedSites: Record<string, number>
    status: Status

    constructor (url: string, site: SiteType | LinkingSiteType) {
      this.url = url
      this.site = site
      this.linkedSites = {}
      this.status = Status.READING
    }
}
