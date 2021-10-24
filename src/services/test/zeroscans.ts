import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ZeroScans
const QUERY = 'all heavenly days'

export async function testZeroScans (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 48'
  desired.image = 'https://zeroscans.com/storage/comics/8DCFC50774FFFF3D13215FE6857AB0811143AF014679A2AC/7GSIDO6mfZXWN1WbKS6MR8QbXXZHsALjDv8tgRy4.jpeg'
  desired.title = 'All Heavenly Days'
  desired.chapterUrl = 'https://zeroscans.com/comics/136750-all-heavenly-days/1/48'
  desired.chapterNum = 48

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://zeroscans.com/storage/comics/8DCFC50774FFFF3D13215FE6857AB0811143AF014679A2AC/7GSIDO6mfZXWN1WbKS6MR8QbXXZHsALjDv8tgRy4.jpeg'
  desired.chapter = 'Chapter 48'
  desired.url = 'https://zeroscans.com/comics/136750-all-heavenly-days'

  return searchValid(results, desired, QUERY)
}
