import { BaseSite } from '../baseSite'
import PQueue from 'p-queue'
import { ComponentRenderProxy } from '@vue/composition-api'
import Worker from 'worker-loader!src/workers/mangadex.worker'
import { MangaDexWorker } from './mangadexWorker'

export class MangaDex extends BaseSite {
  siteType = MangaDexWorker.siteType
  WorkerClass = Worker
  requestQueue = new PQueue({ interval: 1000, intervalCap: 1 })

  constructor () {
    super()
    this.checkLogin().then(loggedIn => {
      this.loggedIn = loggedIn
    }).catch(error => {
      console.error(error)
      this.loggedIn = false
    })
  }

  checkLogin (): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.search('together with the rain').then(results => {
        resolve(!(results instanceof Error))
      }).catch(error => {
        reject(error)
      })
    })
  }

  getMangaId (_componentRenderProxy: ComponentRenderProxy, url: string): Promise<number | Error> {
    const matches = /\/title\/(\d*)/gm.exec(url) || []
    let mangaId = -1

    for (const match of matches) {
      const parsedMatch = parseInt(match)
      if (!isNaN(parsedMatch)) mangaId = parsedMatch
    }

    return Promise.resolve(mangaId)
  }

  getTestUrl (): string {
    return MangaDexWorker.testUrl
  }
}
