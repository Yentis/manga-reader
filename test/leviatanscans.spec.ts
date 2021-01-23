import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { GenkanWorker } from '../src/classes/sites/genkan/genkanWorker'

const siteType = SiteType.LeviatanScans
const worker = new GenkanWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = GenkanWorker.getTestUrl(siteType)
  const query = 'stresser'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Chapter 8'
    desired.image = 'https://leviatanscans.com/storage/comics/BCB5DC2B80EFE1F1AA0CD616E62D075313A91F7CD6FFDFFC/BFzN2G6vA89PxW15VHliJxTLNXUO185Srlyt0GAH.jpeg'
    desired.title = 'Stresser'
    desired.chapterUrl = 'https://leviatanscans.com/comics/909261-stresser/1/8'
    desired.chapterNum = 8

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://leviatanscans.com/storage/comics/BCB5DC2B80EFE1F1AA0CD616E62D075313A91F7CD6FFDFFC/BFzN2G6vA89PxW15VHliJxTLNXUO185Srlyt0GAH.jpeg'
    desired.chapter = 'Chapter 8'
    desired.url = 'https://leviatanscans.com/comics/909261-stresser'

    return search(worker, query, desired)
  })
})
