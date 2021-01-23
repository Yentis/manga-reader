import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { WordPressWorker } from '../src/classes/sites/wordpress/wordpressWorker'

const siteType = SiteType.ManhwaClub
const worker = new WordPressWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = WordPressWorker.getTestUrl(siteType)
  const query = 'settia'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Chapter 25'
    desired.image = 'https://manhwa.club/wp-content/uploads/2020/04/Settia-193x278.jpg'
    desired.title = 'Settia'
    desired.chapterUrl = 'https://manhwa.club/manhwa/settia/chapter-25'
    desired.chapterNum = 25

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://manhwa.club/wp-content/uploads/2020/04/Settia-193x278.jpg'
    desired.chapter = 'Chapter 25'
    desired.url = 'https://manhwa.club/manhwa/settia/'

    return search(worker, query, desired)
  })
})
