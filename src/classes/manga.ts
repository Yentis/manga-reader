import { SiteType } from '../enums/siteEnum'

export class Manga {
    url: string;
    site: SiteType;
    chapter = 'Unknown';
    image = '';
    title = 'Unknown';
    chapterUrl = '';
    read: string | undefined;
    readUrl: string | undefined;

    constructor (url: string, site: SiteType) {
      this.url = url
      this.site = site
    }
}
