import moment from 'moment'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { SiteName, SiteType } from 'src/enums/siteEnum'
import ChromeWindow from 'src/interfaces/chromeWindow'

const siteAliases = [
  { url: 'manganato.com', site: SiteType.Manganelo },
  { url: '1stkissmanga.love', site: SiteType.FirstKissManga },
  { url: '1stkissmanga.com', site: SiteType.FirstKissManga }
]

const chromeWindow = (window as unknown) as ChromeWindow

export function parseHtmlFromString (html: string, parser?: DOMParser): Promise<Document> {
  return new Promise((resolve) => {
    chromeWindow.requestIdleCallback(() => {
      resolve((parser || new DOMParser()).parseFromString(html, 'text/html'))
    })
  })
}

export function titleContainsQuery (query: string, title?: string): boolean {
  if (!title) return false

  query = query.replace('’', '\'')
  title = title.replace('’', '\'')
  const querySplit = query.toLowerCase().split(' ')

  return querySplit.every(word => title?.toLowerCase().includes(word))
}

export function parseNum (elem?: string | null): number {
  const parsedInt = parseFloat(elem || '0')
  if (isNaN(parsedInt)) {
    return 0
  } else {
    return parsedInt
  }
}

export function getDateFromNow (input?: string | null): string {
  const date = moment()
  const chapterDate = input?.trim().split(' ') || []
  let amount = -1

  if (chapterDate[0]) {
    amount = parseInt(chapterDate[0]) || -1
  }

  if (amount !== -1 && chapterDate[1]) {
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
