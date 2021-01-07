
import { Genkan } from '../src/classes/sites/genkan'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.MethodScans

describe(SiteName[siteType], function () {
  const site = new Genkan(siteType)
  const query = 'meng shi zai shang'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'Yuan Yuan is as sharp as ever'
    desired.image = 'https://methodscans.com/storage/comics/32C023D5E17475B0A11F44D374454D1731B83F43D8576CF3/O7ExypuTakfFfImsojgiZqwd1dFTGevwYCKY2707.png'
    desired.title = 'Meng Shi Zai Shang'
    desired.chapterUrl = 'https://methodscans.com/comics/773532-meng-shi-zai-shang/1/172'
    desired.chapterNum = 172

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://methodscans.com/storage/comics/32C023D5E17475B0A11F44D374454D1731B83F43D8576CF3/O7ExypuTakfFfImsojgiZqwd1dFTGevwYCKY2707.png'
    desired.chapter = 'Yuan Yuan is as sharp as ever'
    desired.url = 'https://methodscans.com/comics/773532-meng-shi-zai-shang'

    return search(site, query, desired)
  })
})
