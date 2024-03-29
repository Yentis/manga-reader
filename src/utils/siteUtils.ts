import moment from 'moment'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { Guya, SiteName, SiteType } from 'src/enums/siteEnum'
import ChromeWindow from 'src/interfaces/chromeWindow'

type DOMParserSupportedType = 'text/html' | 'text/xml'

export const siteAliases = [
  { url: 'manganelo.com', site: SiteType.Manganato },
  { url: 'readmanganato.com', site: SiteType.Manganato },
  { url: 'chapmanganato.to', site: SiteType.Manganato },
  { url: '1stkissmanga.love', site: SiteType.LikeManga },
  { url: '1stkissmanga.com', site: SiteType.LikeManga },
  { url: '1stkissmanga.io', site: SiteType.LikeManga },
  { url: '1stkissmanga.me', site: SiteType.LikeManga },
  { url: Guya, site: SiteType.Cubari },
  { url: 'mangakomi.com', site: SiteType.MangaKomi },
  { url: 'www.asurascans.com', site: SiteType.AsuraScans },
  { url: 'asurascans.com', site: SiteType.AsuraScans },
  { url: 'asura.gg', site: SiteType.AsuraScans },
  { url: 'asura.nacm.xyz', site: SiteType.AsuraScans },
  { url: 'leviatanscans.com', site: SiteType.LSComic },
  { url: 'en.leviatanscans.com', site: SiteType.LSComic },
  { url: 'flamescans.org', site: SiteType.FlameComics },
  { url: 'luminousscans.com', site: SiteType.LuminousScans },
  { url: 'luminousscans.gg', site: SiteType.LuminousScans },
  { url: 'reapercomics.com', site: SiteType.ReaperScans },
  { url: 'reset-scans.com', site: SiteType.ResetScans },
  { url: 'reset-scans.us', site: SiteType.ResetScans },
  { url: 'zeroscans.com', site: SiteType.ZeroScans },
  { url: 'luminousscans.net', site: SiteType.LuminousScans },
]

export function getUrl(url: string) {
  return `https://${url}`
}

export function parseHtmlFromString(
  html: string,
  parser?: DOMParser,
  type: DOMParserSupportedType = 'text/html'
): Promise<Document> {
  const chromeWindow = window as unknown as ChromeWindow

  return new Promise((resolve) => {
    chromeWindow.requestIdleCallback(
      () => {
        resolve((parser || new DOMParser()).parseFromString(html, type))
      },
      { timeout: 1000 }
    )
  })
}

export function titleContainsQuery(query: string, title?: string): boolean {
  if (title === undefined) return false

  query = query.replace('’', "'")
  title = title.replace('’', "'")
  const querySplit = query.toLowerCase().split(' ')

  return querySplit.every((word) => title?.toLowerCase().includes(word))
}

export function parseNum(elem?: string | null): number {
  if (typeof elem !== 'string') return 0
  const parsedInt = parseFloat(elem)

  if (isNaN(parsedInt)) {
    return 0
  } else {
    return parsedInt
  }
}

export function matchNum(text: string | undefined) {
  if (!text) return 0

  const pattern = /[0-9]{1,}([,.][0-9]*)?/gm
  let num = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    const matchedValue = match[0]
    if (!matchedValue) continue

    const parsedMatch = parseFloat(matchedValue)
    if (!isNaN(parsedMatch)) {
      num = parsedMatch
      break
    }
  }

  return num
}

export function getDateFromNow(input?: string | null): string {
  const date = moment()
  const chapterDate = input?.trim().split(' ') || []
  let amount = -1

  if (chapterDate[0] !== undefined) {
    amount = parseInt(chapterDate[0]) || -1
  }

  if (amount !== -1 && chapterDate[1] !== undefined) {
    const durationUnit = chapterDate[1]
    if (durationUnit.startsWith('sec')) {
      date.subtract(amount, 'second')
    } else if (durationUnit.startsWith('min')) {
      date.subtract(amount, 'minute')
    } else if (durationUnit.startsWith('hour')) {
      date.subtract(amount, 'hour')
    } else if (durationUnit.startsWith('day')) {
      date.subtract(amount, 'day')
    } else if (durationUnit.startsWith('week')) {
      date.subtract(amount, 'week')
    } else if (durationUnit.startsWith('month')) {
      date.subtract(amount, 'month')
    } else if (durationUnit.startsWith('year')) {
      date.subtract(amount, 'year')
    }

    return date.fromNow()
  }

  return ''
}

export function getSiteByUrl(url: string): SiteType | undefined {
  const site = Object.values(SiteType).find((site) => url.includes(site))
  if (site !== undefined) return site

  const siteAlias = siteAliases.find((alias) => url.includes(alias.url))?.site
  return siteAlias
}

export function getSiteNameByUrl(url: string): SiteName | undefined {
  let siteType: LinkingSiteType | SiteType | undefined = getSiteByUrl(url)
  if (siteType === undefined) {
    siteType = Object.values(LinkingSiteType).find((site) => url.includes(site))
    if (siteType === undefined) return undefined
  }

  return SiteName[siteType]
}
