import { QVueGlobals } from 'quasar/dist/types'
import { Manga } from 'src/classes/manga'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { SiteType } from 'src/enums/siteEnum'
import { getMangaInfoByUrl } from './siteService'
import { testAsuraScans } from './test/asurascans'
import { testBatoto } from './test/batoto'
import { testLikeManga } from './test/likemanga'
import { testFlameComics } from './test/flamecomics'
import { testHiperDEX } from './test/hiperdex'
import { testMangaDex } from './test/mangadex'
import { testMangago } from './test/mangago'
import { testMangakakalot } from './test/mangakakalot'
import { testMangaKomi } from './test/mangakomi'
import { testReaperScans } from './test/reaperscans'
import { testResetScans } from './test/resetscans'
import { testWebtoons } from './test/webtoons'
import { testZeroScans } from './test/zeroscans'
import { testKitsu } from './test/kitsu'
import { testCubari } from './test/cubari'
import { testTapas } from './test/tapas'
import { testComikey } from './test/comikey'
import { testTappytoon } from './test/tappytoon'
import { testScyllaScans } from './test/scyllascans'

export default async function testAll(
  $q: QVueGlobals
): Promise<{ site: SiteType | LinkingSiteType; error: unknown }[]> {
  const promises: Promise<void>[] = []
  const errors: { site: SiteType | LinkingSiteType; error: unknown }[] = []

  promises.push(
    testAsuraScans().catch((error) => {
      errors.push({ site: SiteType.AsuraScans, error: error })
    })
  )
  promises.push(
    testBatoto().catch((error) => {
      errors.push({ site: SiteType.Batoto, error: error })
    })
  )
  promises.push(
    testComikey().catch((error) => {
      errors.push({ site: SiteType.Comikey, error: error })
    })
  )
  promises.push(
    testCubari().catch((error) => {
      errors.push({ site: SiteType.Cubari, error: error })
    })
  )
  promises.push(
    testLikeManga().catch((error) => {
      errors.push({ site: SiteType.LikeManga, error: error })
    })
  )
  promises.push(
    testFlameComics().catch((error) => {
      errors.push({ site: SiteType.FlameComics, error: error })
    })
  )
  promises.push(
    testHiperDEX().catch((error) => {
      errors.push({ site: SiteType.HiperDEX, error: error })
    })
  )
  promises.push(
    testKitsu($q).catch((error) => {
      errors.push({ site: LinkingSiteType.Kitsu, error: error })
    })
  )
  promises.push(
    testMangaDex().catch((error) => {
      errors.push({ site: SiteType.MangaDex, error: error })
    })
  )
  promises.push(
    testMangago().catch((error) => {
      errors.push({ site: SiteType.Mangago, error: error })
    })
  )
  promises.push(
    testMangakakalot().catch((error) => {
      errors.push({ site: SiteType.Mangakakalot, error: error })
    })
  )
  promises.push(
    testMangaKomi().catch((error) => {
      errors.push({ site: SiteType.MangaKomi, error: error })
    })
  )
  promises.push(
    testReaperScans().catch((error) => {
      errors.push({ site: SiteType.ReaperScans, error: error })
    })
  )
  promises.push(
    testResetScans().catch((error) => {
      errors.push({ site: SiteType.ResetScans, error: error })
    })
  )
  promises.push(
    testScyllaScans().catch((error) => {
      errors.push({ site: SiteType.ScyllaScans, error: error })
    })
  )
  promises.push(
    testTapas().catch((error) => {
      errors.push({ site: SiteType.Tapas, error: error })
    })
  )
  promises.push(
    testTappytoon().catch((error) => {
      errors.push({ site: SiteType.Tappytoon, error: error })
    })
  )
  promises.push(
    testWebtoons().catch((error) => {
      errors.push({ site: SiteType.Webtoons, error: error })
    })
  )
  promises.push(
    testZeroScans().catch((error) => {
      errors.push({ site: SiteType.ZeroScans, error: error })
    })
  )

  await Promise.all(promises)
  return errors
}

export function mangaEqual(actual: Manga | Error, desired: Manga, checkDate = true): void {
  if (actual instanceof Error) throw actual

  if (actual.url !== desired.url) {
    throw Error(`Failed ${desired.url}\nExpected url: ${desired.url}\nActual: ${actual.url}`)
  } else if (actual.site !== desired.site) {
    throw Error(`Failed ${desired.url}\nExpected site: ${desired.site}\nActual: ${actual.site}`)
  } else if (actual.chapter !== desired.chapter) {
    throw Error(`Failed ${desired.url}\nExpected chapter: ${desired.chapter}\nActual: ${actual.chapter}`)
  } else if (!actual.image.includes(desired.image)) {
    throw Error(`Failed ${desired.url}\nExpected image: ${desired.image}\nActual: ${actual.image}`)
  } else if (actual.title !== desired.title) {
    throw Error(`Failed ${desired.url}\nExpected title: ${desired.title}\nActual: ${actual.title}`)
  } else if (actual.chapterUrl !== desired.chapterUrl) {
    throw Error(`Failed ${desired.url}\nExpected chapter url: ${desired.chapterUrl}\nActual: ${actual.chapterUrl}`)
  } else if (actual.read !== desired.read) {
    throw Error(
      `Failed ${desired.url}\nExpected read: ${desired.read || 'undefined'}\nActual: ${actual.read || 'undefined'}`
    )
  } else if (actual.readUrl !== desired.read) {
    throw Error(
      `Failed ${desired.url}\nExpected read url: ${desired.readUrl || 'undefined'}\nActual: ${
        actual.readUrl || 'undefined'
      }`
    )
  } else if (desired.chapterDate && actual.chapterDate !== desired.chapterDate) {
    throw Error(
      `Failed ${desired.chapterDate}\nExpected chapter date: ${desired.chapterDate || 'undefined'}\nActual: ${
        actual.chapterDate || 'undefined'
      }`
    )
  } else if (checkDate && !actual.chapterDate.includes('ago')) {
    throw Error(`Failed ${desired.url}\nChapter date not valid: ${actual.chapterDate}`)
  } else if (actual.chapterNum !== desired.chapterNum) {
    throw Error(`Failed ${desired.url}\nExpected chapter num: ${desired.chapterNum}\nActual: ${actual.chapterNum}`)
  }
}

export async function searchValid(results: Manga[], desired: Manga, query: string): Promise<void> {
  const matchingManga = results.filter((manga) => {
    if (manga.site !== desired.site) {
      console.error(`Site did not match: ${manga.site} | ${desired.site}`)
      return false
    }

    if (manga.title.toLowerCase() !== query.toLowerCase()) {
      console.error(`Title did not match: ${manga.title.toLowerCase()} | ${query.toLowerCase()}`)
      return false
    }

    if (!manga.image.includes(desired.image)) {
      console.error(`Image did not match: ${manga.image} | ${desired.image}`)
      return false
    }

    if (desired.chapter !== 'Unknown' && manga.chapter !== desired.chapter) {
      console.error(`Chapter did not match: ${manga.chapter} | ${desired.chapter}`)
      return false
    }

    if (manga.url !== desired.url) {
      console.error(`URL did not match: ${manga.url} | ${desired.url}`)
      return false
    }

    return true
  })

  const resultManga = matchingManga[0]
  if (!resultManga) {
    throw Error(
      `Failed ${desired.url}\nNo matching results, expected\n[${JSON.stringify(desired)}] got\n${JSON.stringify(
        results
      )}`
    )
  } else if (matchingManga.length > 1) {
    throw Error(
      `Failed ${desired.url}\nToo many results, expected\n[${JSON.stringify(desired)}] got\n${JSON.stringify(results)}`
    )
  }

  const linkingSiteTypeUrls: string[] = Object.values(LinkingSiteType)
  if (linkingSiteTypeUrls.includes(resultManga.site)) return

  const manga = await getMangaInfoByUrl(resultManga.url)
  if (manga instanceof Error) throw manga
}
