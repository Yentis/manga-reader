import { Manga } from 'src/classes/manga'
import type { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'
import moment from 'moment'

const SITE_TYPE = SiteType.Kagane
const QUERY = 'the girl I like forgot her glasses'

export async function testKagane(): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await readUrlAlt(site)
  await search(site)
}

async function readUrl(site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 110.2'
  desired.image = `${site.getUrl()}/api/v2/image/019c29bc-0809-70e8-b5c3-9fd032cfb619/compressed`
  desired.title = 'The Girl I Like Forgot Her Glasses'
  desired.chapterUrl = `${site.getUrl()}/series/019c29bc-0812-7957-a697-94a6f70f09d6/reader/019c29e1-91b3-7174-b5ad-42e54ac5f310`
  desired.chapterNum = 120
  desired.chapterDate = moment('2025-08-02', 'YYYY-MM-DD').fromNow()

  mangaEqual(manga, desired)
}

async function readUrlAlt(site: BaseSite): Promise<void> {
  const url = `${site.getUrl()}/series/019c2a33-d3b2-777b-871b-a093e2cf7701`
  const manga = await getMangaInfo(url, SITE_TYPE)
  const desired = new Manga(url, SITE_TYPE)
  const chapterNum = 80

  desired.chapter = `Chapter ${chapterNum}`
  desired.image = `${site.getUrl()}/api/v2/image/01a15500-e908-78c8-b99a-07ccc90e6e51/compressed`
  desired.title = 'All My Neighbors are Convinced the Female Knight from My Rice Field Is My Wife'
  desired.chapterUrl = `${site.getUrl()}/series/019c2a33-d3b2-777b-871b-a093e2cf7701/reader/01a154ea-1551-77a1-963f-35276aa158d8`
  desired.chapterNum = chapterNum
  desired.chapterDate = moment('2026-10-19T16:06:29.455825Z').fromNow()

  mangaEqual(manga, desired)
}

async function search(site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = `${site.getUrl()}/api/v2/image/019c29bc-0809-70e8-b5c3-9fd032cfb619/compressed`
  desired.title = 'The Girl I Like Forgot Her Glasses (Manga Up!)'
  desired.chapter = '120'
  desired.url = `${site.getUrl()}/series/019c29bc-0812-7957-a697-94a6f70f09d6`

  return searchValid(results, desired)
}
