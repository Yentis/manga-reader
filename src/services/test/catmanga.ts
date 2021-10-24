import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.CatManga
const QUERY = 'a couple of cuckoos'

export async function testCatManga (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 74'
  desired.image = 'https://images.catmanga.org/series/fechi/covers/06.jpg'
  desired.title = 'Fechippuru ~Our Innocent Love~'
  desired.chapterUrl = 'https://catmanga.org/series/fechi/74'
  desired.chapterNum = 74

  mangaEqual(manga, desired, false)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://images.catmanga.org/series/cuckoo/covers/05.jpg'
  desired.chapter = 'Chapter 83 - As If I Could Act Normal Like This...!'
  desired.url = 'https://catmanga.org/series/cuckoo'

  return searchValid(results, desired, QUERY)
}
