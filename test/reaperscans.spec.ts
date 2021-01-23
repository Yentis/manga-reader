import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { GenkanWorker } from '../src/classes/sites/genkan/genkanWorker'

const siteType = SiteType.ReaperScans
const worker = new GenkanWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = GenkanWorker.getTestUrl(siteType)
  const query = 'alpha'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'End'
    desired.image = 'https://reaperscans.com/storage/comics/EB4E79D4AF295DAFD75B2CE8C91E9B8CF209090AB259BE2A/rYXSCHcBgkjup3vxpqhg4RH7Q1LwhqLXS6hPGZIK.jpeg'
    desired.title = 'ALPHA'
    desired.chapterUrl = 'https://reaperscans.com/comics/621295-alpha/1/20'
    desired.chapterNum = 20

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://reaperscans.com/storage/comics/EB4E79D4AF295DAFD75B2CE8C91E9B8CF209090AB259BE2A/rYXSCHcBgkjup3vxpqhg4RH7Q1LwhqLXS6hPGZIK.jpeg'
    desired.chapter = 'End'
    desired.url = 'https://reaperscans.com/comics/621295-alpha'

    return search(worker, query, desired)
  })
})
