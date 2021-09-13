import { Manga } from 'src/classes/manga'
import { GenkanioWorker } from 'src/classes/sites/genkanio/genkanioWorker'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo } from '../siteService'
import { mangaEqual } from '../testService'

const SITE_TYPE = SiteType.Genkan
const TEST_URL = GenkanioWorker.testUrl

export async function testGenkanio (): Promise<void> {
  await readUrl()
}

async function readUrl (): Promise<void> {
  const manga = await getMangaInfo(TEST_URL, SITE_TYPE)
  const desired = new Manga(TEST_URL, SITE_TYPE)
  desired.chapter = 'Castle Chapter 78'
  desired.image = 'https://proxy.genkan.io?h=600&w=400&q=100&t=absolute&errorredirect=https%3A%2F%2Fcdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2F79cda3d3-53e8-4ac8-9083-d23099d12348%2FYkfgKidrdL7Y8gX1E2BZWlim55872oDfGPcps1gD.jpg&output=webp&url=ssl%3Acdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2F79cda3d3-53e8-4ac8-9083-d23099d12348%2FYkfgKidrdL7Y8gX1E2BZWlim55872oDfGPcps1gD.jpg'
  desired.title = 'Castle'
  desired.chapterUrl = 'https://genkan.io/manga/8383424626-castle/chapters/22272'
  desired.chapterNum = 78

  mangaEqual(manga, desired)
}
