
import { Genkan } from '../src/classes/sites/genkan'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.ReaperScans

describe(SiteName[siteType], function () {
  const site = new Genkan(siteType)
  const query = 'alpha'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'End'
    desired.image = 'https://reaperscans.com/storage/comics/EB4E79D4AF295DAFD75B2CE8C91E9B8CF209090AB259BE2A/rYXSCHcBgkjup3vxpqhg4RH7Q1LwhqLXS6hPGZIK.jpeg'
    desired.title = 'ALPHA'
    desired.chapterUrl = 'https://reaperscans.com/comics/621295-alpha/1/20'
    desired.chapterNum = 20

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://reaperscans.com/storage/comics/EB4E79D4AF295DAFD75B2CE8C91E9B8CF209090AB259BE2A/rYXSCHcBgkjup3vxpqhg4RH7Q1LwhqLXS6hPGZIK.jpeg'
    desired.chapter = 'End'
    desired.url = 'https://reaperscans.com/comics/621295-alpha'

    return search(site, query, desired)
  })
})
