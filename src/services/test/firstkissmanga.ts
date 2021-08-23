import { Manga } from 'src/classes/manga'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.FirstKissManga
const TEST_URL = WordPressWorker.getTestUrl(SITE_TYPE)
const QUERY = 'cajole a childe into being my boyfriend'

export async function testFirstKissManga (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 99'
  desired.image = 'https://1stkissmanga.com/wp-content/uploads/2019/12/Hades-Delivery-Shop-193x278.jpg'
  desired.title = 'Ripples Of Love'
  desired.chapterUrl = 'https://1stkissmanga.com/manga/ripples-of-love/chapter-99/'
  desired.chapterNum = 99

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://1stkissmanga.com/wp-content/uploads/2019/12/Cajole-a-Childe-Into-Being-My-Boyfriend-193x278.jpg'
  desired.chapter = 'Chapter 155'
  desired.url = 'https://1stkissmanga.com/manga/cajole-a-childe-into-being-my-boyfriend/'

  return searchValid(results, desired, QUERY)
}
