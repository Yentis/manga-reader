import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.Genkan
const QUERY = 'mercenary enrollment'

export async function testGenkanio (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Castle Chapter 78'
  desired.image = 'https://proxy.genkan.io?h=600&w=400&q=100&t=absolute&errorredirect=https%3A%2F%2Fcdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2F79cda3d3-53e8-4ac8-9083-d23099d12348%2FYkfgKidrdL7Y8gX1E2BZWlim55872oDfGPcps1gD.jpg&output=webp&url=ssl%3Acdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2F79cda3d3-53e8-4ac8-9083-d23099d12348%2FYkfgKidrdL7Y8gX1E2BZWlim55872oDfGPcps1gD.jpg'
  desired.title = 'Castle'
  desired.chapterUrl = 'https://genkan.io/manga/8383424626-castle/chapters/22272'
  desired.chapterNum = 78

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://proxy.genkan.io?h=600&w=400&q=100&t=absolute&errorredirect=https%3A%2F%2Fcdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2Fdb4fc4b1-acd2-44c9-ad6a-c5cb2e8d52ea%2FStldaDMTZGn8vFKq2ZdMkPOmD9S2a8TSL5BNo35l.png&output=webp&url=ssl%3Acdn.genkan.io%2Ffile%2Fgenkan-io%2Fmanga%2Fdb4fc4b1-acd2-44c9-ad6a-c5cb2e8d52ea%2FStldaDMTZGn8vFKq2ZdMkPOmD9S2a8TSL5BNo35l.png'
  desired.chapter = 'Chapter 58'
  desired.url = 'https://genkan.io/manga/8970537179-mercenary-enrollment'

  return searchValid(results, desired, QUERY)
}
