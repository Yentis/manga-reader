import { Manga } from 'src/classes/manga'
import { GenkanWorker } from 'src/classes/sites/genkan/genkanWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ZeroScans
const TEST_URL = GenkanWorker.getTestUrl(SITE_TYPE)
const QUERY = 'all heavenly days'

export async function testZeroScans (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 48'
  desired.image = 'https://zeroscans.com/storage/comics/8DCFC50774FFFF3D13215FE6857AB0811143AF014679A2AC/7GSIDO6mfZXWN1WbKS6MR8QbXXZHsALjDv8tgRy4.jpeg'
  desired.title = 'All Heavenly Days'
  desired.chapterUrl = 'https://zeroscans.com/comics/136750-all-heavenly-days/1/48'
  desired.chapterNum = 48

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://zeroscans.com/storage/comics/8DCFC50774FFFF3D13215FE6857AB0811143AF014679A2AC/7GSIDO6mfZXWN1WbKS6MR8QbXXZHsALjDv8tgRy4.jpeg'
  desired.chapter = 'Chapter 48'
  desired.url = 'https://zeroscans.com/comics/136750-all-heavenly-days'

  return searchValid(results, desired, QUERY)
}
