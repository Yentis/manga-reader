import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ScyllaScans
const QUERY = 'one in a hundred'

export async function testScyllaScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 6'
  desired.image = 'https://i2.wp.com/cdn.scyllascans.org/works/db6b48e0-5b2d-11ec-a302-c7bd018ebdbc/420cunetnoiselevel3ttaresult.jpg?strip=all&quality=100'
  desired.title = 'One in a Hundred'
  desired.chapterUrl = 'https://scyllascans.org/read/one_in_a_hundred_/en/0/6.0'
  desired.chapterNum = 6
  desired.chapterDate = 'a year ago'

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://i2.wp.com/cdn.scyllascans.org/works/db6b48e0-5b2d-11ec-a302-c7bd018ebdbc/420cunetnoiselevel3ttaresult.jpg?strip=all&quality=100'
  desired.chapter = 'Chapter 6'
  desired.url = 'https://scyllascans.org/work/en/one_in_a_hundred_'

  return searchValid(results, desired, QUERY)
}
