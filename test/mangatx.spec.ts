import { WordPress } from '../src/classes/sites/wordpress'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.MangaTx

describe(SiteName[siteType], function () {
  const site = new WordPress(siteType)
  const query = 'grandest wedding'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'Chapter 169 [End]'
    desired.image = 'https://mangatx.com/wp-content/uploads/2019/10/85012-193x278.png'
    desired.title = 'Grandest Wedding'
    desired.chapterUrl = 'https://mangatx.com/manga/grandest-wedding/chapter-169-end/'
    desired.chapterNum = 169

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://mangatx.com/wp-content/uploads/2019/10/85012-193x278.png'
    desired.chapter = 'Chapter 169 [End]'
    desired.url = 'https://mangatx.com/manga/grandest-wedding/'

    return search(site, query, desired)
  })
})
