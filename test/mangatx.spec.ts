import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { WordPressWorker } from '../src/classes/sites/wordpress/wordpressWorker'

const siteType = SiteType.MangaTx
const worker = new WordPressWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = WordPressWorker.getTestUrl(siteType)
  const query = 'grandest wedding'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Chapter 169 [End]'
    desired.image = 'https://mangatx.com/wp-content/uploads/2019/10/85012-193x278.png'
    desired.title = 'Grandest Wedding'
    desired.chapterUrl = 'https://mangatx.com/manga/grandest-wedding/chapter-169-end/'
    desired.chapterNum = 169

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://mangatx.com/wp-content/uploads/2019/10/85012-193x278.png'
    desired.chapter = 'Chapter 169 [End]'
    desired.url = 'https://mangatx.com/manga/grandest-wedding/'

    return search(worker, query, desired)
  })
})
