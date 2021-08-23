import { Manga } from 'src/classes/manga'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.ResetScans
const TEST_URL = WordPressWorker.getTestUrl(SITE_TYPE)
const QUERY = 'story of bones and ashes'

export async function testResetScans (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 04'
  desired.image = 'https://reset-scans.com/wp-content/uploads/2021/04/truth-weaver-cover-193x278.png'
  desired.title = 'Madou no Keifu'
  desired.chapterUrl = 'https://reset-scans.com/manga/madou-no-keifu/chapter-04/'
  desired.chapterNum = 4

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://reset-scans.com/wp-content/uploads/2021/04/thumbnail_202x164d359edd0_6433_4f07_81d7_786d7bf79fc2_00001123.jpeg'
  desired.chapter = 'Chapter 01'
  desired.url = 'https://reset-scans.com/manga/story-of-bones-and-ashes/'

  return searchValid(results, desired, QUERY)
}
