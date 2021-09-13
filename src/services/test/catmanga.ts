import { Manga } from 'src/classes/manga'
import { CatMangaWorker } from 'src/classes/sites/catmanga/catmangaWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.CatManga
const TEST_URL = CatMangaWorker.testUrl
const QUERY = 'a couple of cuckoos'

export async function testCatManga (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 74'
  desired.image = 'https://images.catmanga.org/series/fechi/covers/06.jpg'
  desired.title = 'Fechippuru ~Our Innocent Love~'
  desired.chapterUrl = 'https://catmanga.org/series/fechi/74'
  desired.chapterNum = 74

  mangaEqual(manga, desired, false)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://images.catmanga.org/series/cuckoo/covers/05.jpg'
  desired.chapter = 'Chapter 78'
  desired.url = 'https://catmanga.org/series/cuckoo'

  return searchValid(results, desired, QUERY)
}
