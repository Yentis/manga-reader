import { WordPress } from '../src/classes/sites/wordpress'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.MangaKomi

describe(SiteName[siteType], function () {
  const site = new WordPress(siteType)
  const query = 'nanatsu no taizai'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'Chapter 34 - The End'
    desired.image = 'https://mangakomi.com/wp-content/uploads/2020/08/thumb_5f35bc951b432.png'
    desired.title = 'Good Night'
    desired.chapterUrl = 'https://mangakomi.com/manga/good-night/chapter-34/'
    desired.chapterNum = 34

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://mangakomi.com/wp-content/uploads/2020/03/thumb_5e5c4904a9158.jpg'
    desired.chapter = 'Chapter 346.6'
    desired.url = 'https://mangakomi.com/manga/nanatsu-no-taizai/'

    return search(site, query, desired)
  })
})
