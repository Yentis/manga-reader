
import { Genkan } from '../src/classes/sites/genkan'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.LeviatanScans

describe(SiteName[siteType], function () {
  const site = new Genkan(siteType)
  const query = 'stresser'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'Chapter 8'
    desired.image = 'https://leviatanscans.com/storage/comics/BCB5DC2B80EFE1F1AA0CD616E62D075313A91F7CD6FFDFFC/BFzN2G6vA89PxW15VHliJxTLNXUO185Srlyt0GAH.jpeg'
    desired.title = 'Stresser'
    desired.chapterUrl = 'https://leviatanscans.com/comics/909261-stresser/1/8'
    desired.chapterNum = 8

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://leviatanscans.com/storage/comics/BCB5DC2B80EFE1F1AA0CD616E62D075313A91F7CD6FFDFFC/BFzN2G6vA89PxW15VHliJxTLNXUO185Srlyt0GAH.jpeg'
    desired.chapter = 'Chapter 8'
    desired.url = 'https://leviatanscans.com/comics/909261-stresser'

    return search(site, query, desired)
  })
})
