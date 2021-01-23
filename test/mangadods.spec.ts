import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { WordPressWorker } from '../src/classes/sites/wordpress/wordpressWorker'

const siteType = SiteType.MangaDoDs
const worker = new WordPressWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = WordPressWorker.getTestUrl(siteType)
  const query = 'a fairytale for the demon lord'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Vol.02 Ch.020'
    desired.image = 'https://www.mangadods.com/wp-content/uploads/2017/10/a-fairytale-for-the-demon-lord-10-193x278.jpg'
    desired.title = 'A Fairytale for the Demon Lord'
    desired.chapterUrl = 'https://www.mangadods.com/manga/a-fairytale-for-the-demon-lord/vol-02/ch-020_1/'
    desired.chapterNum = 54

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://www.mangadods.com/wp-content/uploads/2017/10/a-fairytale-for-the-demon-lord-10-193x278.jpg'
    desired.chapter = 'Ch.034.9'
    desired.url = 'https://www.mangadods.com/manga/a-fairytale-for-the-demon-lord/'

    return search(worker, query, desired)
  })
})
