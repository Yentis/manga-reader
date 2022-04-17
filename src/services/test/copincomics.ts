import { Manga } from 'src/classes/manga'
import { BaseSite } from 'src/classes/sites/baseSite'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfo, getSite, searchManga } from '../siteService'
import { mangaEqual, searchValid } from '../testService'

const SITE_TYPE = SiteType.CopinComics
const QUERY = 'return survival'

export async function testCopinComics (): Promise<void> {
  const site = getSite(SITE_TYPE)
  if (!site) throw Error('Site not found')

  await readUrl(site)
  await search(site)
}

async function readUrl (site: BaseSite): Promise<void> {
  const manga = await getMangaInfo(site.getTestUrl(), SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.chapter = 'Episode 34'
  desired.image = 'https://s3.us-west-1.amazonaws.com/t.copincomics.com/img/title/301/k4nO3ait32_3x4.png'
  desired.title = 'Return Survival'
  desired.chapterUrl = ''
  desired.chapterNum = 34
  desired.chapterDate = '7 months ago'

  mangaEqual(manga, desired)
}

async function search (site: BaseSite): Promise<void> {
  const results = await searchManga(QUERY, SITE_TYPE)
  const desired = new Manga(site.getTestUrl(), SITE_TYPE)
  desired.image = 'https://s3.us-west-1.amazonaws.com/t.copincomics.com/img/title/301/k4nO3ait32_3x4.png'
  desired.chapter = 'Episode 34'
  desired.url = 'https://copincomics.com/toon/301'

  return searchValid(results, desired, QUERY)
}
