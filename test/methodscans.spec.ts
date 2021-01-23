import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { GenkanWorker } from '../src/classes/sites/genkan/genkanWorker'

const siteType = SiteType.MethodScans
const worker = new GenkanWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = GenkanWorker.getTestUrl(siteType)
  const query = 'meng shi zai shang'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Yuan Yuan is as sharp as ever'
    desired.image = 'https://methodscans.com/storage/comics/32C023D5E17475B0A11F44D374454D1731B83F43D8576CF3/O7ExypuTakfFfImsojgiZqwd1dFTGevwYCKY2707.png'
    desired.title = 'Meng Shi Zai Shang'
    desired.chapterUrl = 'https://methodscans.com/comics/773532-meng-shi-zai-shang/1/172'
    desired.chapterNum = 172

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://methodscans.com/storage/comics/32C023D5E17475B0A11F44D374454D1731B83F43D8576CF3/O7ExypuTakfFfImsojgiZqwd1dFTGevwYCKY2707.png'
    desired.chapter = 'Yuan Yuan is as sharp as ever'
    desired.url = 'https://methodscans.com/comics/773532-meng-shi-zai-shang'

    return search(worker, query, desired)
  })
})
