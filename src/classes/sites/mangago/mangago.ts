import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/workers/mangago.worker'
import { MangagoWorker } from './mangagoWorker'

export class Mangago extends BaseSite {
  siteType = MangagoWorker.siteType
  WorkerClass = Worker

  getUrl (): string {
    return MangagoWorker.url
  }

  getLoginUrl (): string {
    return `${this.getUrl()}/home/accounts/login/`
  }

  getTestUrl (): string {
    return MangagoWorker.testUrl
  }
}
