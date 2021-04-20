import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { WordPressWorker } from '../src/classes/sites/wordpress/wordpressWorker'

const siteType = SiteType.ArangScans
const worker = new WordPressWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = WordPressWorker.getTestUrl(siteType)
  const query = 'leveling up, by only eating!'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Chapter 32'
    desired.image = 'https://arangscans.com/wp-content/uploads/2021/01/48217-193x278.jpg'
    desired.title = 'Leveling Up, by Only Eating!'
    desired.chapterUrl = 'https://arangscans.com/manga/leveling-up-by-only-eating/chapter-32/'
    desired.chapterNum = 32

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://arangscans.com/wp-content/uploads/2021/01/48217-193x278.jpg'
    desired.chapter = 'Chapter 32'
    desired.url = 'https://arangscans.com/manga/leveling-up-by-only-eating/'

    return search(worker, query, desired)
  })
})
