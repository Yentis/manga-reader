import { WordPress } from '../src/classes/sites/wordpress'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.FirstKissManga

describe(SiteName[siteType], function () {
  const site = new WordPress(siteType)
  const query = 'cajole a childe into being my boyfriend'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = 'Chapter 99'
    desired.image = 'https://1stkissmanga.com/wp-content/uploads/2019/12/Hades-Delivery-Shop-193x278.jpg'
    desired.title = 'Ripples Of Love'
    desired.chapterUrl = 'https://1stkissmanga.com/manga/ripples-of-love/chapter-99/'
    desired.chapterNum = 99

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://1stkissmanga.com/wp-content/uploads/2019/12/Cajole-a-Childe-Into-Being-My-Boyfriend-193x278.jpg'
    desired.chapter = 'Chapter 155'
    desired.url = 'https://1stkissmanga.com/manga/cajole-a-childe-into-being-my-boyfriend/'

    return search(site, query, desired)
  })
})
