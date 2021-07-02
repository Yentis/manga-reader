import { Manga } from 'src/classes/manga'
import { GenkanWorker } from 'src/classes/sites/genkan/genkanWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.MethodScans
const TEST_URL = GenkanWorker.getTestUrl(SITE_TYPE)
const QUERY = 'meng shi zai shang'

export async function testMethodScans (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Yuan Yuan is as sharp as ever'
  desired.image = 'https://methodscans.com/storage/comics/32C023D5E17475B0A11F44D374454D1731B83F43D8576CF3/O7ExypuTakfFfImsojgiZqwd1dFTGevwYCKY2707.png'
  desired.title = 'Meng Shi Zai Shang'
  desired.chapterUrl = 'https://methodscans.com/comics/773532-meng-shi-zai-shang/1/172'
  desired.chapterNum = 172

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://methodscans.com/storage/comics/32C023D5E17475B0A11F44D374454D1731B83F43D8576CF3/O7ExypuTakfFfImsojgiZqwd1dFTGevwYCKY2707.png'
  desired.chapter = 'Yuan Yuan is as sharp as ever'
  desired.url = 'https://methodscans.com/comics/773532-meng-shi-zai-shang'

  return searchValid(results, desired, QUERY)
}
