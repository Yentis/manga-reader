import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { GenkanWorker } from '../src/classes/sites/genkan/genkanWorker'

const siteType = SiteType.LynxScans
const worker = new GenkanWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = GenkanWorker.getTestUrl(siteType)
  const query = 'I stack experience through reading books'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Volume 2 Chapter 1'
    desired.image = 'https://lynxscans.com/storage/comics/8D05F5079B603C1A9CC73689B5EC57670EA64A56782F1850/haF3HtsXzE4ZebquDIeTvGvLZ82sUKOBmKMLWVUf.png'
    desired.title = 'Dawn of the Eastland'
    desired.chapterUrl = 'https://lynxscans.com/comics/698439-dawn-of-the-eastland/2/1'
    desired.chapterNum = 66

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://lynxscans.com/storage/comics/CB1A3734FFFEAC0B145518DE63E5A2595A9ED3D19BB8FB33/TSj0g29sAXcOooYgNFI6MAhSX029U2SujAFhpXHo.png'
    desired.chapter = 'Chapter 35'
    desired.url = 'https://lynxscans.com/comics/366412-i-stack-experience-through-reading-books'

    return search(worker, query, desired)
  })
})
