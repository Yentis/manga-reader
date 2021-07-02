import { Manga } from 'src/classes/manga'
import { GenkanioWorker } from 'src/classes/sites/genkanio/genkanioWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Genkan
const TEST_URL = GenkanioWorker.testUrl
const QUERY = 'the great mage returns'

export async function testGenkanio (): Promise<void> {
  await readUrl()
  await search()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Happy 69 Chapters~'
  desired.image = 'https://proxy.genkan.io?h=600&w=400&q=100&t=absolute&errorredirect=https%3A%2F%2Fcdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2F79cda3d3-53e8-4ac8-9083-d23099d12348%2FYkfgKidrdL7Y8gX1E2BZWlim55872oDfGPcps1gD.jpg&output=webp&url=ssl%3Acdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2F79cda3d3-53e8-4ac8-9083-d23099d12348%2FYkfgKidrdL7Y8gX1E2BZWlim55872oDfGPcps1gD.jpg'
  desired.title = 'Castle'
  desired.chapterUrl = 'https://genkan.io/manga/8383424626-castle/chapters/16610'
  desired.chapterNum = 69

  mangaEqual(manga, desired)
}

async function search (): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.image = 'https://images.weserv.nl/?h=600&w=400&q=100&t=absolute&errorredirect=https%3A%2F%2Fcdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2Fc932b0c7-a984-4ab6-8be5-47ea047bd692%2FEPFMyb0jOeUgvR32oPLTreUihBF34jfdc96jJMA1.jpg&output=webp&url=ssl%3Acdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2Fc932b0c7-a984-4ab6-8be5-47ea047bd692%2FEPFMyb0jOeUgvR32oPLTreUihBF34jfdc96jJMA1.jpg'
  desired.chapter = '77'
  desired.url = 'https://genkan.io/manga/2829584385-the-great-mage-returns-after-4000-years'

  return searchValid(results, desired, QUERY)
}
