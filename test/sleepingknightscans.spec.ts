import 'ts-jest'
import { jest } from '@jest/globals'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { WordPressWorker } from '../src/classes/sites/wordpress/wordpressWorker'

jest.setTimeout(20000)

const siteType = SiteType.SleepingKnightScans
const worker = new WordPressWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = WordPressWorker.getTestUrl(siteType)
  const query = 'volcanic age'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = '142'
    desired.image = 'https://skscans.com/wp-content/uploads/2021/03/cover-chronicles-193x278.png'
    desired.title = 'Chronicles of Heavenly Demon'
    desired.chapterUrl = 'https://skscans.com/manga/chronicles-of-heavenly-demon/142/'
    desired.chapterNum = 142

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://skscans.com/wp-content/uploads/2021/03/cover-_VA-193x278.jpg'
    desired.chapter = '167'
    desired.url = 'https://skscans.com/manga/volcanic-age/'

    return search(worker, query, desired)
  })
})
