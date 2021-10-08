import { QVueGlobals } from 'quasar/dist/types'
import { Manga } from 'src/classes/manga'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfoByUrl } from './siteService'
import { testArangScans } from './test/arangscans'
import { testAsuraScans } from './test/asurascans'
import { testBatoto } from './test/batoto'
import { testCatManga } from './test/catmanga'
import { testEdelgardeScans } from './test/edelgardescans'
import { testFirstKissManga } from './test/firstkissmanga'
import { testFlameScans } from './test/flamescans'
import { testGenkanio } from './test/genkanio'
import { testHatigarmScans } from './test/hatigarmscans'
import { testHiperDEX } from './test/hiperdex'
import { testLeviatanScans } from './test/leviatanscans'
import { testLynxScans } from './test/lynxscans'
import { testMangaDex } from './test/mangadex'
import { testMangago } from './test/mangago'
import { testMangakakalot } from './test/mangakakalot'
import { testMangaKomi } from './test/mangakomi'
import { testManganelo } from './test/manganelo'
import { testMangaTx } from './test/mangatx'
import { testManhwaClub } from './test/manhwaclub'
import { testMethodScans } from './test/methodscans'
import { testReaperScans } from './test/reaperscans'
import { testResetScans } from './test/resetscans'
import { testSleepingKnightScans } from './test/sleepingknightscans'
import { testWebtoons } from './test/webtoons'
import { testZeroScans } from './test/zeroscans'
import { testBiliBiliComics } from './test/bilibilicomics'

export default async function testAll (
  $q: QVueGlobals
): Promise<{ site: SiteType | LinkingSiteType, error: unknown }[]> {
  const promises: Promise<void>[] = []
  const errors: { site: SiteType | LinkingSiteType, error: unknown }[] = []

  promises.push(testArangScans().catch((error) => {
    errors.push({ site: SiteType.ArangScans, error: error })
  }))
  promises.push(testAsuraScans().catch((error) => {
    errors.push({ site: SiteType.AsuraScans, error: error })
  }))
  promises.push(testBatoto().catch((error) => {
    errors.push({ site: SiteType.Batoto, error: error })
  }))
  promises.push(testBiliBiliComics().catch((error) => {
    errors.push({ site: SiteType.BiliBiliComics, error: error })
  }))
  promises.push(testCatManga().catch((error) => {
    errors.push({ site: SiteType.CatManga, error: error })
  }))
  promises.push(testEdelgardeScans().catch((error) => {
    errors.push({ site: SiteType.EdelgardeScans, error: error })
  }))
  promises.push(testFirstKissManga().catch((error) => {
    errors.push({ site: SiteType.FirstKissManga, error: error })
  }))
  promises.push(testFlameScans().catch((error) => {
    errors.push({ site: SiteType.FlameScans, error: error })
  }))
  promises.push(testGenkanio().catch((error) => {
    errors.push({ site: SiteType.Genkan, error: error })
  }))
  promises.push(testHatigarmScans().catch((error) => {
    errors.push({ site: SiteType.HatigarmScans, error: error })
  }))
  promises.push(testHiperDEX().catch((error) => {
    errors.push({ site: SiteType.HiperDEX, error: error })
  }))
  promises.push(testLeviatanScans().catch((error) => {
    errors.push({ site: SiteType.LeviatanScans, error: error })
  }))
  promises.push(testLynxScans().catch((error) => {
    errors.push({ site: SiteType.LynxScans, error: error })
  }))
  promises.push(testMangaDex().catch((error) => {
    errors.push({ site: SiteType.MangaDex, error: error })
  }))
  promises.push(testMangago().catch((error) => {
    errors.push({ site: SiteType.Mangago, error: error })
  }))
  promises.push(testMangakakalot().catch((error) => {
    errors.push({ site: SiteType.Mangakakalot, error: error })
  }))
  promises.push(testMangaKomi().catch((error) => {
    errors.push({ site: SiteType.MangaKomi, error: error })
  }))
  promises.push(testManganelo().catch((error) => {
    errors.push({ site: SiteType.Manganelo, error: error })
  }))
  promises.push(testMangaTx().catch((error) => {
    errors.push({ site: SiteType.MangaTx, error: error })
  }))
  promises.push(testManhwaClub().catch((error) => {
    errors.push({ site: SiteType.ManhwaClub, error: error })
  }))
  promises.push(testMethodScans().catch((error) => {
    errors.push({ site: SiteType.MethodScans, error: error })
  }))
  promises.push(testReaperScans().catch((error) => {
    errors.push({ site: SiteType.ReaperScans, error: error })
  }))
  promises.push(testResetScans().catch((error) => {
    errors.push({ site: SiteType.ResetScans, error: error })
  }))
  promises.push(testSleepingKnightScans().catch((error) => {
    errors.push({ site: SiteType.SleepingKnightScans, error: error })
  }))
  promises.push(testWebtoons($q).catch((error) => {
    errors.push({ site: SiteType.Webtoons, error: error })
  }))
  promises.push(testZeroScans().catch((error) => {
    errors.push({ site: SiteType.ZeroScans, error: error })
  }))

  await Promise.all(promises)
  return errors
}

export function mangaEqual (
  actual: Manga | Error,
  desired: Manga,
  checkDate = true
): void {
  if (actual instanceof Error) throw actual

  if (actual.url !== desired.url) throw Error(`Failed ${desired.url}\nExpected url: ${desired.url}\nActual: ${actual.url}`)
  else if (actual.site !== desired.site) throw Error(`Failed ${desired.url}\nExpected site: ${desired.site}\nActual: ${actual.site}`)
  else if (actual.chapter !== desired.chapter) throw Error(`Failed ${desired.url}\nExpected chapter: ${desired.chapter}\nActual: ${actual.chapter}`)
  else if (actual.image !== desired.image) throw Error(`Failed ${desired.url}\nExpected image: ${desired.image}\nActual: ${actual.image}`)
  else if (actual.title !== desired.title) throw Error(`Failed ${desired.url}\nExpected title: ${desired.title}\nActual: ${actual.title}`)
  else if (actual.chapterUrl !== desired.chapterUrl) throw Error(`Failed ${desired.url}\nExpected chapter url: ${desired.chapterUrl}\nActual: ${actual.chapterUrl}`)
  else if (actual.read !== desired.read) throw Error(`Failed ${desired.url}\nExpected read: ${desired.read || 'undefined'}\nActual: ${actual.read || 'undefined'}`)
  else if (actual.readUrl !== desired.read) throw Error(`Failed ${desired.url}\nExpected read url: ${desired.readUrl || 'undefined'}\nActual: ${actual.readUrl || 'undefined'}`)
  else if (checkDate && !actual.chapterDate.includes('ago')) throw Error(`Failed ${desired.url}\nChapter date not valid: ${actual.chapterDate}`)
  else if (actual.chapterNum !== desired.chapterNum) throw Error(`Failed ${desired.url}\nExpected chapter num: ${desired.chapterNum}\nActual: ${actual.chapterNum}`)
}

export async function searchValid (
  results: Manga[],
  desired: Manga,
  query: string
): Promise<void> {
  const matchingManga = results.filter((manga) => {
    const site = manga.site === desired.site
    const title = manga.title.toLowerCase() === query.toLowerCase()
    const image = manga.image === desired.image
    const chapter = desired.chapter === 'Unknown' || manga.chapter === desired.chapter
    const url = manga.url === desired.url

    return site && title && image && chapter && url
  })

  if (matchingManga.length === 0) throw Error(`Failed ${desired.url}\nNo matching results, expected\n[${JSON.stringify(desired)}] got\n${JSON.stringify(results)}`)
  else if (matchingManga.length > 1) throw Error(`Failed ${desired.url}\nToo many results, expected\n[${JSON.stringify(desired)}] got\n${JSON.stringify(results)}`)
  const resultManga = matchingManga[0]

  const linkingSiteTypeUrls: string[] = Object.values(LinkingSiteType)
  if (linkingSiteTypeUrls.includes(resultManga.site)) return

  const manga = await getMangaInfoByUrl(resultManga.url)
  if (manga instanceof Error) throw manga
}
