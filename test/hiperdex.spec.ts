
import { WordPress } from '../src/classes/sites/wordpress'
import { Manga } from '../src/classes/manga'
import { SiteName, SiteType } from '../src/enums/siteEnum'
import { readUrl, search } from './helper'

const siteType = SiteType.HiperDEX

describe(SiteName[siteType], function () {
  const site = new WordPress(siteType)
  const query = 'cabalist'

  this.timeout(10000)

  it('Read URL', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.chapter = '35 [END]'
    desired.image = 'https://hiperdex.com/wp-content/uploads/2020/04/Arata-Primal-193x278.jpg'
    desired.title = 'Arata Primal'
    desired.chapterUrl = 'https://hiperdex.com/manga/arata-primal-the-new-primitive/35-end/'
    desired.chapterNum = 35

    return readUrl(site, desired)
  })

  it('Search', () => {
    const desired = new Manga(site.getTestUrl(), siteType)
    desired.image = 'https://hiperdex.com/wp-content/uploads/2020/04/Cabalist-193x278.jpg'
    desired.chapter = '44 [END]'
    desired.url = 'https://hiperdex.com/manga/cabalistin/'

    return search(site, query, desired)
  })
})
