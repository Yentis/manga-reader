import { Manganelo } from '../src/classes/sites/manganelo'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.Manganelo

describe(SiteName[siteType], function () {
  const site = new Manganelo()
  const query = 'together with the rain'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'Vol.6 Chapter 57: The Final Chapter'
    desired.image = 'https://avt.mkklcdnv6.com/8/x/18-1583497426.jpg'
    desired.title = 'Kudan No Gotoshi'
    desired.chapterUrl = 'https://manganelo.com/chapter/pu918807/chapter_57'
    desired.chapterNum = 57

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://avt.mkklcdnv6.com/48/l/21-1597329685.jpg'
    desired.chapter = 'Chapter 2: That’s what\'s unfair about you! [END]'
    desired.url = 'https://manganelo.com/manga/pg923760'

    return search(site, query, desired)
  })
})
