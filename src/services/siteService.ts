import {
  Manga
} from '../classes/manga'
import {
  SiteName,
  SiteType
} from '../enums/siteEnum'
import {
  Manganelo
} from '../classes/sites/manganelo/manganelo'
import {
  Genkan
} from '../classes/sites/genkan/genkan'
import {
  Webtoons
} from '../classes/sites/webtoons/webtoons'
import {
  Mangakakalot
} from '../classes/sites/mangakakalot/mangakakalot'
import {
  MangaDex
} from '../classes/sites/mangadex/mangadex'
import {
  WordPress
} from '../classes/sites/wordpress/wordpress'
import {
  BaseSite
} from '../classes/sites/baseSite'
import {
  AsuraScans
} from '../classes/sites/asura/asurascans'
import {
  Mangago
} from '../classes/sites/mangago/mangago'
import {
  Batoto
} from '../classes/sites/batoto/batoto'
import {
  Genkanio
} from '../classes/sites/genkanio/genkanio'
import {
  Kitsu
} from '../classes/sites/kitsu/kitsu'
import {
  LinkingSiteType
} from '../enums/linkingSiteEnum'
import PQueue from 'p-queue'
import {
  ArangScans
} from '../classes/sites/arang/arangscans'
import { CatManga } from 'src/classes/sites/catmanga/catmanga'
import constants from 'src/classes/constants'
import { ManhwaClub } from 'src/classes/sites/manhwaclub/manhwaclub'

const requestQueue = new PQueue({ interval: 1000, intervalCap: 20 })
const mangaDex = new MangaDex()
const siteMap = new Map<string, BaseSite>([
  [SiteType.Manganelo, new Manganelo()],
  [SiteType.Webtoons, new Webtoons()],
  [SiteType.HatigarmScans, new Genkan(SiteType.HatigarmScans)],
  [SiteType.FirstKissManga, new WordPress(SiteType.FirstKissManga)],
  [SiteType.Mangakakalot, new Mangakakalot()],
  [SiteType.MangaDex, mangaDex],
  [SiteType.MangaKomi, new WordPress(SiteType.MangaKomi)],
  [SiteType.MethodScans, new Genkan(SiteType.MethodScans)],
  [SiteType.LeviatanScans, new WordPress(SiteType.LeviatanScans)],
  [SiteType.HiperDEX, new WordPress(SiteType.HiperDEX)],
  [SiteType.ReaperScans, new WordPress(SiteType.ReaperScans)],
  [SiteType.AsuraScans, new AsuraScans(SiteType.AsuraScans)],
  [SiteType.ManhwaClub, new ManhwaClub()],
  [SiteType.MangaTx, new WordPress(SiteType.MangaTx)],
  [SiteType.Mangago, new Mangago()],
  [SiteType.SleepingKnightScans, new WordPress(SiteType.SleepingKnightScans)],
  [SiteType.ZeroScans, new Genkan(SiteType.ZeroScans)],
  [SiteType.LynxScans, new Genkan(SiteType.LynxScans)],
  [SiteType.Batoto, new Batoto()],
  [SiteType.ArangScans, new ArangScans()],
  [SiteType.EdelgardeScans, new Genkan(SiteType.EdelgardeScans)],
  [SiteType.Genkan, new Genkanio()],
  [SiteType.FlameScans, new AsuraScans(SiteType.FlameScans)],
  [SiteType.ResetScans, new WordPress(SiteType.ResetScans)],
  [SiteType.CatManga, new CatManga()]
])
const linkingSiteMap = new Map<string, BaseSite>([
  [LinkingSiteType.MangaDex, mangaDex],
  [LinkingSiteType.Kitsu, new Kitsu()]
])
const siteAliases = [
  { url: 'manganato.com', site: SiteType.Manganelo },
  { url: '1stkissmanga.love', site: SiteType.FirstKissManga },
  { url: '1stkissmanga.com', site: SiteType.FirstKissManga }
]

function createRace (promise: Promise<Error | Manga[]>): Promise<Error | Manga[]> {
  const timeoutPromise: Promise<Error | Manga[]> = new Promise(resolve => setTimeout(() => resolve(Error('Timed out')), 10000))
  return Promise.race([
    promise,
    timeoutPromise
  ])
}

export function checkSites (): void {
  siteMap.forEach(site => {
    void site.checkLogin()
    void site.checkState()
  })
}

export function getSiteByUrl (url: string): SiteType | undefined {
  const site = Object.values(SiteType).find((site) => url.includes(site))
  if (site !== undefined) return site

  const siteAlias = siteAliases.find((alias) => url.includes(alias.url))?.site
  return siteAlias
}

export function getSiteNameByUrl (url: string): SiteName | undefined {
  let siteType: LinkingSiteType | SiteType | undefined = getSiteByUrl(url)
  if (siteType === undefined) {
    siteType = Object.values(LinkingSiteType).find((site) => url.includes(site))
    if (siteType === undefined) return undefined
  }

  return SiteName[siteType]
}

export async function getMangaInfoByUrl (url: string, altSources: Record<string, string> = {}, redirectCount = 0): Promise <Error | Manga> {
  const site = getSiteByUrl(url)
  if (site === undefined) {
    return Error('Valid site not found')
  }

  return getMangaInfo(url, site, altSources, redirectCount)
}

export async function getMangaInfo (
  url: string,
  siteType: SiteType | LinkingSiteType,
  altSources: Record<string, string> = {},
  redirectCount = 0
): Promise <Error | Manga> {
  let error: Error | undefined

  const site = siteMap.get(siteType)
  if (site) {
    const result = await requestQueue.add(() => site.readUrl(url))
    if (result instanceof Manga) return result
    if (result.message.startsWith(constants.REDIRECT_PREFIX) && redirectCount < 5) {
      return getMangaInfoByUrl(result.message.replace(constants.REDIRECT_PREFIX, ''), altSources, redirectCount + 1)
    }
    error = result
  }

  for (const urlSource of Object.keys(altSources)) {
    const site = siteMap.get(urlSource)
    if (!site) continue

    const result = await requestQueue.add(() => site.readUrl(altSources[urlSource]))
    if (!(result instanceof Error)) return result
  }

  return error || Error('Invalid site type')
}

export function searchManga (query: string, siteType: SiteType | LinkingSiteType | undefined = undefined): Promise <Manga[]> {
  return requestQueue.add(async () => {
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

      siteMap.forEach(site => {
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

export function getSiteMap () {
  return siteMap
}

export function getSite (siteType: SiteType | LinkingSiteType): BaseSite | undefined {
  return siteMap.get(siteType) || linkingSiteMap.get(siteType)
}
