import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { ManganeloWorker } from '../src/classes/sites/manganelo/manganeloWorker'

const siteType = SiteType.Manganelo
const worker = new ManganeloWorker()

describe(SiteName[siteType], function () {
  const testUrl = ManganeloWorker.testUrl
  const query = 'together with the rain'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Vol.6 Chapter 57: The Final Chapter'
    desired.image = 'https://avt.mkklcdnv6.com/8/x/18-1583497426.jpg'
    desired.title = 'Kudan No Gotoshi'
    desired.chapterUrl = 'https://manganelo.com/chapter/pu918807/chapter_57'
    desired.chapterNum = 57

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://avt.mkklcdnv6.com/48/l/21-1597329685.jpg'
    desired.chapter = 'Chapter 2: That’s what\'s unfair about you! [END]'
    desired.url = 'https://manganelo.com/manga/pg923760'

    return search(worker, query, desired)
  })
})
