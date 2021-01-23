import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { WordPressWorker } from '../src/classes/sites/wordpress/wordpressWorker'

const siteType = SiteType.HiperDEX
const worker = new WordPressWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = WordPressWorker.getTestUrl(siteType)
  const query = 'cabalist'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = '35 [END]'
    desired.image = 'https://hiperdex.com/wp-content/uploads/2020/04/Arata-Primal-193x278.jpg'
    desired.title = 'Arata Primal'
    desired.chapterUrl = 'https://hiperdex.com/manga/arata-primal-the-new-primitive/35-end/'
    desired.chapterNum = 35

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://hiperdex.com/wp-content/uploads/2020/04/Cabalist-193x278.jpg'
    desired.chapter = '44 [END]'
    desired.url = 'https://hiperdex.com/manga/cabalistin/'

    return search(worker, query, desired)
  })
})
