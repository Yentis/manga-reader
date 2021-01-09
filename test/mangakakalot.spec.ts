import { Mangakakalot } from '../src/classes/sites/mangakakalot'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.Mangakakalot

describe(SiteName[siteType], function () {
  const site = new Mangakakalot()
  const query = 'together with the rain'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'Vol.8 Chapter 953.6: Volume 8 Extras'
    desired.image = 'https://avt.mkklcdnv6.com/19/e/1-1583464448.jpg'
    desired.title = 'Tomo-chan wa Onnanoko!'
    desired.chapterUrl = 'https://mangakakalot.com/chapter/tomochan_wa_onnanoko/chapter_953.6'
    desired.chapterNum = 953.6

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://avt.mkklcdnv6.com/48/l/21-1597329685.jpg'
    desired.chapter = 'Chapter 2: That’s What\'s Unfair About You! [END]'
    desired.url = 'https://mangakakalot.com/manga/pg923760'

    return search(site, query, desired)
  })
})
