import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { MangaDex } from 'src/classes/sites/mangadex'
import { SiteType } from 'src/enums/siteEnum'
import { requestHandler } from '../requestService'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.MangaDex
const QUERY = 'together with the rain'

export async function testMangaDex (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
  await convertLegacyIds()
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Chapter 95 - World of Stars and Stripes - Outro'
  desired.image = 'https://uploads.mangadex.org/covers/1044287a-73df-48d0-b0b2-5327f32dd651/b625ddac-757c-44a4-a392-b315ccdf4fb2.jpg'
  desired.title = 'JoJo\'s Bizarre Adventure Part 7 - Steel Ball Run (Official Colored)'
  desired.chapterUrl = 'https://mangadex.org/chapter/8a984365-fd9d-4f6e-85f9-0d58e0a592a3'
  desired.chapterNum = 95

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://uploads.mangadex.org/covers/159eb4f1-de8f-4c53-91da-03f49fe84250/9450650b-9599-4bf5-b150-4f0d337b484c.jpg'
  desired.chapter = 'Chapter 2 - That’s what\'s unfair about you!'
  desired.url = 'https://mangadex.org/title/159eb4f1-de8f-4c53-91da-03f49fe84250'

  return searchValid(results, desired, QUERY)
}

async function convertLegacyIds (): Promise<void> {
  const ids = [38897, 47017]
  const mappingIds = ['16e1767d-a8d5-4173-b87f-f7023f6c4578', '0f13d05a-dacf-43ff-93ca-165523e55a46']
  const convertedIds = await MangaDex.convertLegacyIds(ids, requestHandler)

  ids.forEach((id, index) => {
    const convertedId = convertedIds[id]
    const mappingId = mappingIds[index]
    if (convertedId === mappingId) return

    throw Error(
      `ID ${id} did not match required mapping ${mappingId !== undefined ? mappingId : ''}
      was: ${convertedId !== undefined ? convertedId : ''}`
    )
  })
}
