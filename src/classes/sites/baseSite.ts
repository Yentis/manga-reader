import { Manga } from '../manga'
import { UrlNavigation } from '../urlNavigation'
import { WorkerRequest } from '../workerRequest'
import { Worker } from '../worker'
import { RequestType } from '../../enums/workerEnum'
import { LinkingSiteType } from '../../enums/linkingSiteEnum'
import { SiteName, SiteState, SiteType } from '../../enums/siteEnum'
import { AxiosRequestConfig } from 'axios'
import PQueue from 'p-queue'
import { BaseWorker } from './baseWorker'
import { Platform } from 'quasar'
import { QVueGlobals } from 'quasar/dist/types'
import { Store } from 'vuex'

export abstract class BaseSite {
  abstract siteType: SiteType | LinkingSiteType
  abstract WorkerClass: { new(): Worker }

  requestQueue = new PQueue({ interval: 1000, intervalCap: 10 })
  loggedIn = true
  state = SiteState.REACHABLE
  requestConfig: AxiosRequestConfig | undefined

  statusOK (): boolean {
    return this.loggedIn && this.state === SiteState.REACHABLE
  }

  hasSearch (): boolean {
    return true
  }

  async checkState (): Promise<void> {
    try {
      const response = await this.readUrl(this.getTestUrl())
      const results = response instanceof Error ? SiteState.OFFLINE : response.title === '' ? SiteState.INVALID : SiteState.REACHABLE

      this.state = results
    } catch (error) {
      console.error(error)
      this.state = SiteState.OFFLINE
    }
  }

  checkLogin (): Promise<boolean> {
    return Promise.resolve(true)
  }

  openLogin ($q: QVueGlobals, store: Store<unknown>): Promise<boolean | Error> {
    store.commit('reader/pushUrlNavigation', new UrlNavigation(this.getLoginUrl(), true))
    return Promise.resolve(false)
  }

  getMangaId ($q: QVueGlobals, store: Store<unknown>, url: string): Promise<number | Error> {
    const parsedUrl = parseInt(url)
    if (!isNaN(parsedUrl)) return Promise.resolve(parsedUrl)

    return Promise.resolve(-1)
  }

  syncReadChapter (mangaId: number, chapterNum: number): Promise<void | Error> {
    return new Promise(resolve => {
      const worker = new this.WorkerClass()
      worker.onmessage = event => {
        if (event.data instanceof Error) {
          resolve(event.data)
        } else {
          resolve()
        }
      }
      const data = new Map()
      data.set('mangaId', mangaId)
      data.set('chapterNum', chapterNum)
      worker.postMessage(new WorkerRequest(RequestType.SYNC_CHAPTER, data, this))
    })
  }

  getUrl (): string {
    return BaseWorker.getUrl(this.siteType)
  }

  getLoginUrl (): string {
    return `${this.getUrl()}/login`
  }

  readUrl (url: string): Promise<Error | Manga> {
    return this.addToQueue(() => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = (event) => {
          if (event.data instanceof Error) {
            resolve(event.data)
          } else if (typeof event.data === 'object') {
            resolve(Manga.clone(event.data as Manga))
          } else {
            resolve(Error('Unknown response received'))
          }
        }
        const data = new Map()
        data.set('url', url)
        worker.postMessage(new WorkerRequest(RequestType.READ_URL, data, this, Platform.is))
      })
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        worker.onmessage = event => {
          if (event.data instanceof Error) {
            resolve(event.data)
          } else if (Array.isArray(event.data)) {
            resolve(event.data.map((item) => Manga.clone(item)))
          } else {
            resolve(Error('Unknown response received'))
          }
        }
        const data = new Map()
        data.set('query', query)
        worker.postMessage(new WorkerRequest(RequestType.SEARCH, data, this, Platform.is))
      })
    })
  }

  compare (b: BaseSite): number {
    if (this.state === SiteState.INVALID && b.state !== SiteState.INVALID) {
      return -1
    } else if (b.state === SiteState.INVALID && this.state !== SiteState.INVALID) {
      return 1
    } else if (!this.loggedIn && b.loggedIn) {
      return -1
    } else if (!b.loggedIn && this.loggedIn) {
      return 1
    } else if (this.state === SiteState.OFFLINE && b.state !== SiteState.OFFLINE) {
      return -1
    } else if (b.state === SiteState.OFFLINE && this.state !== SiteState.OFFLINE) {
      return 1
    } else {
      return SiteName[this.siteType] > SiteName[b.siteType] ? 1 : -1
    }
  }

  protected addToQueue<T> (task: (() => PromiseLike<T | Error>)): Promise<T | Error> {
    return this.requestQueue.add(async () => {
      try {
        return await task()
      } catch (error) {
        if (!(error instanceof Error)) {
          return Error(error)
        } else {
          return error
        }
      }
    })
  }

  abstract getTestUrl(): string
}
