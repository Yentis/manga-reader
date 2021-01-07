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
    desired.chapter = 'Vol.4 Chapter 24: The Great Tehonbiki Gamble, Part 11'
    desired.image = 'https://avt.mkklcdnv6.com/19/k/20-1583501770.jpg'
    desired.title = 'Legend of the End-of-Century Gambling Wolf Saga'
    desired.chapterUrl = 'https://mangakakalot.com/chapter/ui921789/chapter_24'
    desired.chapterNum = 24

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
