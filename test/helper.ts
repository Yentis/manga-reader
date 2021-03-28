import { Manga } from 'src/classes/manga'
import { BaseWorker } from 'src/classes/sites/baseWorker'

export function readUrl (worker: BaseWorker, desired: Manga, url: string) {
  return new Promise<void>((resolve, reject) => {
    worker.readUrl(url).then(mangaInfo => {
      const result = mangaEqual(mangaInfo, desired)

      if (result === true) resolve()
      else reject(result)
    }).catch((error) => reject(error))
  })
}

export function search (worker: BaseWorker, query: string, desired: Manga) {
  return new Promise<void>((resolve, reject) => {
    worker.search(query).then(result => {
      if (result instanceof Error) return reject(result)

      const matchingManga = result.filter(manga => {
        return manga.site === worker.siteType &&
              manga.title.toLowerCase() === query.toLowerCase() &&
              manga.image === desired.image &&
              manga.chapter === desired.chapter &&
              manga.url === desired.url
      })

      if (matchingManga.length === 0) reject(Error(`No matching results, expected\n[${JSON.stringify(desired)}] got\n${JSON.stringify(result)}`))
      else if (matchingManga.length > 1) reject(Error(`Too many results, expected\n[${JSON.stringify(desired)}] got\n${JSON.stringify(result)}`))
      else resolve()
    }).catch(error => reject(error))
  })
}

function mangaEqual (
  actual: Manga | Error,
  desired: Manga
): Error | boolean {
  if (actual instanceof Error) return actual

  if (actual.url !== desired.url) return Error(`Expected url: ${desired.url} | Actual: ${actual.url}`)
  else if (actual.site !== desired.site) return Error(`Expected site: ${desired.site} | Actual: ${actual.site}`)
  else if (actual.chapter !== desired.chapter) return Error(`Expected chapter: ${desired.chapter} | Actual: ${actual.chapter}`)
  else if (actual.image !== desired.image) return Error(`Expected image: ${desired.image} | Actual: ${actual.image}`)
  else if (actual.title !== desired.title) return Error(`Expected title: ${desired.title} | Actual: ${actual.title}`)
  else if (actual.chapterUrl !== desired.chapterUrl) return Error(`Expected chapter url: ${desired.chapterUrl} | Actual: ${actual.chapterUrl}`)
  else if (actual.read !== desired.read) return Error(`Expected read: ${desired.read || 'undefined'} | Actual: ${actual.read || 'undefined'}`)
  else if (actual.readUrl !== desired.read) return Error(`Expected read url: ${desired.readUrl || 'undefined'} | Actual: ${actual.readUrl || 'undefined'}`)
  else if (!actual.chapterDate.includes('ago')) return Error('Chapter date not valid')
  else if (actual.chapterNum !== desired.chapterNum) return Error(`Expected chapter num: ${desired.chapterNum} | Actual: ${actual.chapterNum}`)
  else return true
}
