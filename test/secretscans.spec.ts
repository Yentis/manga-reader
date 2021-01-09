import { Genkan } from '../src/classes/sites/genkan'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.SecretScans

describe(SiteName[siteType], function () {
  const site = new Genkan(siteType)
  const query = 'I stack experience through reading books'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'Volume 2 Chapter 1'
    desired.image = 'https://secretscans.co/storage/comics/8D05F5079B603C1A9CC73689B5EC57670EA64A56782F1850/haF3HtsXzE4ZebquDIeTvGvLZ82sUKOBmKMLWVUf.png'
    desired.title = 'Dawn of the Eastland'
    desired.chapterUrl = 'https://secretscans.co/comics/698439-dawn-of-the-eastland/2/1'
    desired.chapterNum = 66

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://secretscans.co/storage/comics/CB1A3734FFFEAC0B145518DE63E5A2595A9ED3D19BB8FB33/TSj0g29sAXcOooYgNFI6MAhSX029U2SujAFhpXHo.png'
    desired.chapter = 'Chapter 35'
    desired.url = 'https://secretscans.co/comics/366412-i-stack-experience-through-reading-books'

    return search(site, query, desired)
  })
})
