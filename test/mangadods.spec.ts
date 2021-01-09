
import { WordPress } from '../src/classes/sites/wordpress'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.MangaDoDs

describe(SiteName[siteType], function () {
  const site = new WordPress(siteType)
  const query = 'flower war'

  this.timeout(20000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = '22 END'
    desired.image = 'https://www.mangadods.com/wp-content/uploads/2020/02/cover-193x278.jpg'
    desired.title = 'Flower War'
    desired.chapterUrl = 'https://www.mangadods.com/manga/flower-war/22-end/'
    desired.chapterNum = 22

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://www.mangadods.com/wp-content/uploads/2020/02/cover-193x278.jpg'
    desired.chapter = '22 END'
    desired.url = 'https://www.mangadods.com/manga/flower-war/'

    return search(site, query, desired)
  })
})
