import { Manga } from '../classes/manga'
import { SiteType } from '../enums/siteEnum'
import { Manganato } from '../classes/sites/manganato'
import { Webtoons } from '../classes/sites/webtoons'
import { Mangakakalot } from '../classes/sites/mangakakalot'
import { MangaDex } from '../classes/sites/mangadex'
import { WordPress } from '../classes/sites/wordpress'
import { BaseSite } from '../classes/sites/baseSite'
import { FlameComics } from '../classes/sites/flamecomics'
import { Mangago } from '../classes/sites/mangago'
import { Batoto } from '../classes/sites/batoto'
import { Kitsu } from '../classes/sites/kitsu'
import { LinkingSiteType } from '../enums/linkingSiteEnum'
import PQueue from 'p-queue'
import constants from 'src/classes/constants'
import { getSiteByUrl } from 'src/utils/siteUtils'
import { Cubari } from 'src/classes/sites/cubari'
import { Tapas } from 'src/classes/sites/tapas'
import { ZeroScans } from 'src/classes/sites/zeroscans'
import { Comikey } from 'src/classes/sites/comikey'
import { ReaperScans } from 'src/classes/sites/reaperscans'
import { TappyToon } from 'src/classes/sites/tappytoon'
import { ScyllaScans } from 'src/classes/sites/scyllascans'
import { AsuraScans } from 'src/classes/sites/asurascans'

const globalRequestQueue = new PQueue({
  interval: 1000,
  intervalCap: 20,
})

const mangaDex = new MangaDex()
const siteMap = new Map<string, BaseSite>([
  [SiteType.Manganato, new Manganato()],
  [SiteType.Webtoons, new Webtoons()],
  [SiteType.LikeManga, new WordPress(SiteType.LikeManga)],
  [SiteType.Mangakakalot, new Mangakakalot()],
  [SiteType.MangaDex, mangaDex],
  [SiteType.MangaKomi, new WordPress(SiteType.MangaKomi)],
  [SiteType.HiperDEX, new WordPress(SiteType.HiperDEX)],
  [SiteType.ReaperScans, new ReaperScans()],
  [SiteType.AsuraScans, new AsuraScans()],
  [SiteType.Mangago, new Mangago()],
  [SiteType.ZeroScans, new ZeroScans()],
  [SiteType.Batoto, new Batoto()],
  [SiteType.FlameComics, new FlameComics()],
  [SiteType.ResetScans, new WordPress(SiteType.ResetScans)],
  [SiteType.Cubari, new Cubari()],
  [SiteType.Tapas, new Tapas()],
  [SiteType.Comikey, new Comikey()],
  [SiteType.Tappytoon, new TappyToon()],
  [SiteType.ScyllaScans, new ScyllaScans()],
])
const linkingSiteMap = new Map<string, BaseSite>([
  [LinkingSiteType.MangaDex, mangaDex],
  [LinkingSiteType.Kitsu, new Kitsu()],
])
function createRace(promise: Promise<Error | Manga[]>): Promise<Error | Manga[]> {
  const timeoutPromise: Promise<Error | Manga[]> = new Promise((resolve) =>
    setTimeout(() => resolve(Error('Timed out')), 10000)
  )
  return Promise.race([promise, timeoutPromise])
}

export function checkSites(): void {
  siteMap.forEach((site) => {
    void site.checkLogin()
    void site.checkState()
  })
}

export async function getMangaInfoByUrl(
  url: string,
  altSources: Record<string, string> = {},
  redirectCount = 0
): Promise<Error | Manga> {
  const site = getSiteByUrl(url)
  if (site === undefined) {
    return Error('Valid site not found')
  }

  return getMangaInfo(url, site, altSources, redirectCount)
}

export async function getMangaInfo(
  url: string,
  siteType: SiteType | LinkingSiteType,
  altSources: Record<string, string> = {},
  redirectCount = 0
): Promise<Error | Manga> {
  let error: Error | undefined

  let site = siteMap.get(siteType)
  if (!site) {
    const urlSiteType = getSiteByUrl(url)
    if (urlSiteType) site = siteMap.get(urlSiteType)
  }

  if (site) {
    const finalSite = site
    let result: Manga | Error

    try {
      result = await globalRequestQueue.add(() => finalSite.readUrl(url))
    } catch (error) {
      result = error as Error
    }

    if (result instanceof Manga) return result
    if (result.message.startsWith(constants.REDIRECT_PREFIX) && redirectCount < 5) {
      return getMangaInfoByUrl(result.message.replace(constants.REDIRECT_PREFIX, ''), altSources, redirectCount + 1)
    }
    error = result
  }

  for (const [urlSource, url] of Object.entries(altSources)) {
    const site = siteMap.get(urlSource)
    if (!site) continue
    let result: Manga | Error

    try {
      result = await globalRequestQueue.add(() => site.readUrl(url))
    } catch (error) {
      result = error as Error
    }
    if (!(result instanceof Error)) return result
  }

  return error || Error('Invalid site type')
}

export function searchManga(
  query: string,
  siteType: SiteType | LinkingSiteType | undefined = undefined
): Promise<Manga[]> {
  return globalRequestQueue.add(async () => {
    if (siteType) {
      const site = siteMap.get(siteType) || linkingSiteMap.get(siteType)
      const result = await createRace(site?.search(query) || Promise.reject(Error('Invalid site type')))
      if (result instanceof Error) {
        throw result
      } else {
        return result
      }
    } else {
      const promises: Promise<Error | Manga[]>[] = []

      siteMap.forEach((site) => {
        promises.push(createRace(site.search(query)))
      })

      const results = await Promise.all(promises)
      let mangaResults: Manga[] = []

      for (const mangaList of results) {
        if (mangaList instanceof Error) continue
        mangaResults = mangaResults.concat(mangaList)
      }

      return mangaResults
    }
  })
}

export function getSiteMap() {
  return siteMap
}

export function getSite(siteType: SiteType | LinkingSiteType): BaseSite | undefined {
  return siteMap.get(siteType) || linkingSiteMap.get(siteType)
}
