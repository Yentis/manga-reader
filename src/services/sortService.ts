import { Manga } from 'src/classes/manga'
import { SortType } from 'src/enums/sortingEnum'
import { Status } from 'src/enums/statusEnum'

export function mangaSort (a: Manga, b: Manga, sortedBy: SortType): number {
  if ((a.status !== Status.READING || undefined) && (b.status === Status.READING || undefined)) {
    return 1
  }
  if ((b.status !== Status.READING || undefined) && (a.status === Status.READING || undefined)) {
    return -1
  }

  if (a.status === Status.DROPPED && b.status !== Status.DROPPED) {
    return 1
  }
  if (b.status === Status.DROPPED && a.status !== Status.DROPPED) {
    return -1
  }

  if (a.status === Status.PLAN_TO_READ && b.status !== Status.PLAN_TO_READ) {
    return 1
  }
  if (b.status === Status.PLAN_TO_READ && a.status !== Status.PLAN_TO_READ) {
    return -1
  }

  if (a.status === Status.ON_HOLD && b.status !== Status.ON_HOLD) {
    return 1
  }
  if (b.status === Status.ON_HOLD && a.status !== Status.ON_HOLD) {
    return -1
  }

  const isARead = isMangaRead(a.chapter, a.chapterNum, a.read, a.readNum)
  const isBRead = isMangaRead(b.chapter, b.chapterNum, b.read, b.readNum)

  if (!isARead && isBRead) {
    return -1
  }
  if (!isBRead && isARead) {
    return 1
  }

  switch (sortedBy) {
    case SortType.SITE:
      return sortSite(a, b)
    case SortType.CURRENT:
      return sortCurrent(a, b)
    case SortType.DATE:
      return sortDate(a, b)
    case SortType.READ:
      return sortRead(a, b)
    default:
      return sortTitle(a, b)
  }
}

export function isMangaRead (chapter: string, chapterNum: number, read?: string, readNum?: number): boolean {
  return chapter === read || (readNum !== undefined && chapterNum <= readNum)
}

function sortSite (a: Manga, b: Manga) {
  return a.site.toLowerCase() > b.site.toLowerCase() ? 1 : b.site.toLowerCase() > a.site.toLowerCase() ? -1 : sortTitle(a, b)
}

function sortCurrent (a: Manga, b: Manga) {
  return a.chapterNum > b.chapterNum ? 1 : b.chapterNum > a.chapterNum ? -1 : sortTitle(a, b)
}

function sortDate (a: Manga, b: Manga) {
  const aDate = a.chapterDate
  const bDate = b.chapterDate

  if (aDate.endsWith('ago') && !bDate.endsWith('ago')) {
    return -1
  } else if (bDate.endsWith('ago') && !aDate.endsWith('ago')) {
    return 1
  }

  const aDirection = aDate.endsWith('ago') ? -1 : 1
  const bDirection = bDate.endsWith('ago') ? 1 : -1

  if (aDate.includes('second') && !bDate.includes('second')) {
    return aDirection
  } else if (bDate.includes('second') && !aDate.includes('second')) {
    return bDirection
  }

  if (aDate.includes('minute') && !bDate.includes('minute')) {
    return aDirection
  } else if (bDate.includes('minute') && !aDate.includes('minute')) {
    return bDirection
  }

  if (aDate.includes('hour') && !bDate.includes('hour')) {
    return aDirection
  } else if (bDate.includes('hour') && !aDate.includes('hour')) {
    return bDirection
  }

  if (aDate.includes('day') && !bDate.includes('day')) {
    return aDirection
  } else if (bDate.includes('day') && !aDate.includes('day')) {
    return bDirection
  }

  if (aDate.includes('month') && !bDate.includes('month')) {
    return aDirection
  } else if (bDate.includes('month') && !aDate.includes('month')) {
    return bDirection
  }

  let amountA = parseInt(aDate.split(' ')[0])
  if (isNaN(amountA)) amountA = 0

  let amountB = parseInt(bDate.split(' ')[0])
  if (isNaN(amountB)) amountB = 0

  return amountA > amountB ? bDirection : amountB > amountA ? aDirection : sortTitle(a, b)
}

function sortRead (a: Manga, b: Manga) {
  if (a.readNum && b.readNum) {
    return a.readNum > b.readNum ? 1 : b.readNum > a.readNum ? -1 : sortTitle(a, b)
  } else if (a.read && b.read) {
    return a.read.toLowerCase() > b.read.toLowerCase() ? 1 : b.read.toLowerCase() > a.read.toLowerCase() ? -1 : sortTitle(a, b)
  } else {
    return sortTitle(a, b)
  }
}

function sortTitle (a: Manga, b: Manga) {
  return a.title.toLowerCase() > b.title.toLowerCase() ? 1 : b.title.toLowerCase() > a.title.toLowerCase() ? -1 : 0
}
