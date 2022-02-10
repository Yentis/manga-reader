import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.FirstKissManga
const QUERY = 'cajole a childe into being my boyfriend'

export async function testFirstKissManga (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 99'
  desired.image = 'https://1stkissmanga.io/wp-content/uploads/2019/12/Hades-Delivery-Shop-193x278.jpg'
  desired.title = 'Ripples Of Love'
  desired.chapterUrl = 'https://1stkissmanga.io/manga/ripples-of-love/chapter-99/'
  desired.chapterNum = 99
  desired.chapterDate = moment('September 30, 2020', 'MMMM DD, YYYY').fromNow()

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://1stkissmanga.io/wp-content/uploads/2019/12/Cajole-a-Childe-Into-Being-My-Boyfriend-193x278.jpg'
  desired.chapter = 'Chapter 155'
  desired.url = 'https://1stkissmanga.io/manga/cajole-a-childe-into-being-my-boyfriend/'

  return searchValid(results, desired, QUERY)
}
