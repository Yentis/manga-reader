import { Manga } from 'src/classes/manga'
import { GenkanWorker } from 'src/classes/sites/genkan/genkanWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.EdelgardeScans
const TEST_URL = GenkanWorker.getTestUrl(SITE_TYPE)
const QUERY = 'i stack experience through reading books'

export async function testEdelgardeScans (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Chapter 11'
  desired.image = 'https://edelgardescans.com/storage/comics/162DEBAED5DD0619E648EBDC13EBFBD64FADD1479124734F/w64rsLItGSa0MSXBnICvH7AHj92fhdza6zJNnaMR.png'
  desired.title = 'I Stack Experience Through Reading Books'
  desired.chapterUrl = 'https://edelgardescans.com/comics/713627-i-stack-experience-through-writing-books/1/11'
  desired.chapterNum = 11

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://edelgardescans.com/storage/comics/162DEBAED5DD0619E648EBDC13EBFBD64FADD1479124734F/w64rsLItGSa0MSXBnICvH7AHj92fhdza6zJNnaMR.png'
  desired.chapter = 'Chapter 11'
  desired.url = 'https://edelgardescans.com/comics/713627-i-stack-experience-through-writing-books'

  return searchValid(results, desired, QUERY)
}
