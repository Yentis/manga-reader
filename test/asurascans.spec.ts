import { AsuraScans } from '../src/classes/sites/asurascans'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.AsuraScans

describe(SiteName[siteType], function () {
  const site = new AsuraScans()
  const query = 'tougen anki'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'Chapter 19'
    desired.image = 'https://i0.wp.com/asurascans.com/wp-content/uploads/2020/09/49754.jpg'
    desired.title = 'Tougen Anki'
    desired.chapterUrl = 'https://asurascans.com/tougen-anki-chapter-19/'
    desired.chapterNum = 19

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://i0.wp.com/asurascans.com/wp-content/uploads/2020/09/49754.jpg?h=80'
    desired.chapter = '19'
    desired.url = 'https://asurascans.com/manga/tougen-anki/'

    return search(site, query, desired)
  })
})
