import 'ts-jest'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'
import { WordPressWorker } from '../src/classes/sites/wordpress/wordpressWorker'

const siteType = SiteType.FirstKissManga
const worker = new WordPressWorker(siteType)

describe(SiteName[siteType], function () {
  const testUrl = WordPressWorker.getTestUrl(siteType)
  const query = 'cajole a childe into being my boyfriend'

  it('Read URL', () => {
    const desired = new Manga(testUrl, siteType)
    desired.chapter = 'Chapter 99'
    desired.image = 'https://1stkissmanga.com/wp-content/uploads/2019/12/Hades-Delivery-Shop-193x278.jpg'
    desired.title = 'Ripples Of Love'
    desired.chapterUrl = 'https://1stkissmanga.com/manga/ripples-of-love/chapter-99/'
    desired.chapterNum = 99

    return readUrl(worker, desired, testUrl)
  })

  it('Search', () => {
    const desired = new Manga(testUrl, siteType)
    desired.image = 'https://1stkissmanga.com/wp-content/uploads/2019/12/Cajole-a-Childe-Into-Being-My-Boyfriend-193x278.jpg'
    desired.chapter = 'Chapter 155'
    desired.url = 'https://1stkissmanga.com/manga/cajole-a-childe-into-being-my-boyfriend/'

    return search(worker, query, desired)
  })
})
