import { WordPress } from '../src/classes/sites/wordpress'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.ManhwaClub

describe(SiteName[siteType], function () {
  const site = new WordPress(siteType)
  const query = 'settia'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'Chapter 25'
    desired.image = 'https://manhwa.club/wp-content/uploads/2020/04/Settia-193x278.jpg'
    desired.title = 'Settia'
    desired.chapterUrl = 'https://manhwa.club/manhwa/settia/chapter-25'
    desired.chapterNum = 25

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://manhwa.club/wp-content/uploads/2020/04/Settia-193x278.jpg'
    desired.chapter = 'Chapter 25'
    desired.url = 'https://manhwa.club/manhwa/settia/'

    return search(site, query, desired)
  })
})
