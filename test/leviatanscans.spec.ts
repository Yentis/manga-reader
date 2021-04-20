import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { WordPressWorker } from '../src/classes/sites/wordpress/wordpressWorker'

const siteType = SiteType.LeviatanScans
const worker = new WordPressWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = WordPressWorker.getTestUrl(siteType)
  const query = 'martial god asura'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = '30'
    desired.image = 'https://leviatanscans.com/wp-content/uploads/2021/03/cover-_TT-193x278.png'
    desired.title = 'The Throne'
    desired.chapterUrl = 'https://leviatanscans.com/lcomic/manga/the-throne/30/'
    desired.chapterNum = 30

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://leviatanscans.com/wp-content/uploads/2021/03/cover-_MGA-193x278.png'
    desired.chapter = '97'
    desired.url = 'https://leviatanscans.com/lcomic/manga/martial-god-asura/'

    return search(worker, query, desired)
  })
})
