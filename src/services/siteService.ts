import {
  Manga
} from '../classes/manga'
import {
  SiteType
} from '../enums/siteEnum'
import {
  Manganelo
} from '../classes/sites/manganelo'
import {
  Genkan
} from '../classes/sites/genkan'
import {
  Webtoons
} from '../classes/sites/webtoons'
import {
  Mangakakalot
} from '../classes/sites/mangakakalot'
import {
  MangaDex
} from '../classes/sites/mangadex'
import {
  WordPress
} from '../classes/sites/wordpress'
import {
  BaseSite
} from '../classes/sites/baseSite'
import {
  AsuraScans
} from '../classes/sites/asurascans'
import {
  Mangago
} from '../classes/sites/mangago'
import {
  Batoto
} from '../classes/sites/batoto'
import {
  Genkanio
} from '../classes/sites/genkanio'
import {
  Kitsu
} from '../classes/sites/kitsu'
import {
  LinkingSiteType
} from '../enums/linkingSiteEnum'
import PQueue from 'p-queue'
import {
  ArangScans
} from '../classes/sites/arangscans'
import { CatManga } from 'src/classes/sites/catmanga'
import constants from 'src/classes/constants'
import { ManhwaClub } from 'src/classes/sites/manhwaclub'
import { BiliBiliComics } from 'src/classes/sites/bilibilicomics'
import { getSiteByUrl } from 'src/utils/siteUtils'

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
  [SiteType.Genkan, new Genkanio()],
  [SiteType.FlameScans, new AsuraScans(SiteType.FlameScans)],
  [SiteType.ResetScans, new WordPress(SiteType.ResetScans)],
  [SiteType.CatManga, new CatManga()],
  [SiteType.BiliBiliComics, new BiliBiliComics()],
  [SiteType.AlphaScans, new AsuraScans(SiteType.AlphaScans)]
])
const linkingSiteMap = new Map<string, BaseSite>([
  [LinkingSiteType.MangaDex, mangaDex],
  [LinkingSiteType.Kitsu, new Kitsu()]
])
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

  for (const [urlSource, url] of Object.entries(altSources)) {
    const site = siteMap.get(urlSource)
    if (!site) continue

    const result = await requestQueue.add(() => site.readUrl(url))
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
