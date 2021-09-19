import { Manga } from '../manga'
import { UrlNavigation } from '../urlNavigation'
import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { Worker } from '../worker'
import { LinkingSiteType } from '../../enums/linkingSiteEnum'
import { SiteState, SiteType } from '../../enums/siteEnum'
import PQueue from 'p-queue'
import { BaseWorker } from './baseWorker'
import { QVueGlobals } from 'quasar/dist/types'
import { Store } from 'vuex'
import { RequestData, RequestType, SiteRequestType } from 'src/enums/workerEnum'
import { BaseWorkerMessage } from '../workerMessage/baseMessage'
import { getPlatform } from 'src/services/platformService'
import { getSiteNameByUrl } from 'src/services/siteService'

export abstract class BaseSite {
  abstract siteType: SiteType | LinkingSiteType
  abstract WorkerClass: { new(): Worker }

  requestQueue = new PQueue({ interval: 1000, intervalCap: 10 })
  loggedIn = true
  state = SiteState.REACHABLE

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
      this.startWorkerListener(worker, (error) => {
        resolve(error)
      }, () => {
        resolve()
      })
      const data = new Map()
      data.set('mangaId', mangaId)
      data.set('chapterNum', chapterNum)
      worker.postMessage(new SiteWorkerMessage(SiteRequestType.SYNC_CHAPTER, data, this))
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
        this.startWorkerListener(worker, (error) => {
          resolve(error)
        }, (data) => {
          if (typeof data === 'object') {
            resolve(Manga.clone(data as Manga))
          } else {
            resolve(Error('Unknown response received'))
          }
        })
        const data = new Map()
        data.set('url', url)
        worker.postMessage(new SiteWorkerMessage(SiteRequestType.READ_URL, data, this))
      })
    })
  }

  search (query: string): Promise<Error | Manga[]> {
    return this.addToQueue(async () => {
      return new Promise(resolve => {
        const worker = new this.WorkerClass()
        this.startWorkerListener(worker, (error) => {
          resolve(error)
        }, (data) => {
          if (Array.isArray(data)) {
            resolve(data.map((item) => Manga.clone(item)))
          } else {
            resolve(Error('Unknown response received'))
          }
        })
        const data = new Map()
        data.set('query', query)
        worker.postMessage(new SiteWorkerMessage(SiteRequestType.SEARCH, data, this))
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
      const siteName = getSiteNameByUrl(this.siteType)
      const siteNameB = getSiteNameByUrl(b.siteType)

      if (siteName === undefined && siteNameB === undefined) return 0
      if (siteNameB === undefined) return -1
      if (siteName === undefined) return 1

      return siteName > siteNameB ? 1 : -1
    }
  }

  protected addToQueue<T> (task: (() => PromiseLike<T | Error>)): Promise<T | Error> {
    return this.requestQueue.add(async () => {
      try {
        return await task()
      } catch (error) {
        if (!(error instanceof Error)) {
          return Error(error as string)
        } else {
          return error
        }
      }
    })
  }

  private startWorkerListener (
    worker: Worker,
    onError: (error: Error) => void,
    onData: (data: unknown) => void
  ) {
    worker.onmessage = (event) => {
      const message = event.data as BaseWorkerMessage
      if (!(message.type.toUpperCase() in RequestType)) {
        if (message.data.has(RequestData.ERROR)) {
          onError(message.data.get(RequestData.ERROR) as Error)
          return
        }

        if (message.data.has(RequestData.DATA)) {
          onData(message.data.get(RequestData.DATA))
        }
        return
      }

      switch (message.type) {
        case RequestType.PLATFORM: {
          worker.postMessage(this.handlePlatformMessage())
          break
        }
        default:
          break
      }
    }
  }

  private handlePlatformMessage (): BaseWorkerMessage {
    const data = new Map()
    const platform = getPlatform()

    data.set(RequestData.DATA, platform)
    return new BaseWorkerMessage(
      RequestType.PLATFORM,
      data
    )
  }

  abstract getTestUrl(): string
}
