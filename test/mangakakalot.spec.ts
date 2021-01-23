import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { MangakakalotWorker } from '../src/classes/sites/mangakakalot/mangakakalotWorker'

const siteType = SiteType.Mangakakalot
const worker = new MangakakalotWorker()

describe(SiteName[siteType], function () {
  const testUrl = MangakakalotWorker.testUrl
  const query = 'together with the rain'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Vol.8 Chapter 953.6: Volume 8 Extras'
    desired.image = 'https://avt.mkklcdnv6.com/19/e/1-1583464448.jpg'
    desired.title = 'Tomo-chan wa Onnanoko!'
    desired.chapterUrl = 'https://mangakakalot.com/chapter/tomochan_wa_onnanoko/chapter_953.6'
    desired.chapterNum = 953.6

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://avt.mkklcdnv6.com/48/l/21-1597329685.jpg'
    desired.chapter = 'Chapter 2: That’s What\'s Unfair About You! [END]'
    desired.url = 'https://mangakakalot.com/manga/pg923760'

    return search(worker, query, desired)
  })
})
