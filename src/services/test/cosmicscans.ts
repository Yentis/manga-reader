import moment from 'moment'
import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.CosmicScans
const QUERY = 'i have max level luck'

export async function testCosmicScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 9'
  desired.image = 'https://cosmicscans.com/wp-content/uploads/2022/06/i-have-max-level-luck.jpeg'
  desired.title = 'I Have Max Level Luck'
  desired.chapterUrl = 'https://cosmicscans.com/i-have-max-level-luck-chapter-9/'
  desired.chapterNum = 9
  desired.chapterDate = moment('25/06/2022', 'DD/MM/YYYY').fromNow()

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://i3.wp.com/cosmicscans.com/wp-content/uploads/2022/06/i-have-max-level-luck.jpeg?resize=65,85'
  desired.chapter = '9'
  desired.url = 'https://cosmicscans.com/manga/i-have-max-level-luck/'

  return searchValid(results, desired, QUERY)
}
