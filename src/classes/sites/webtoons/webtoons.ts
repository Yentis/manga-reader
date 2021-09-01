import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/worker/site.worker'
import { WebtoonsWorker } from './webtoonsWorker'

export class Webtoons extends BaseSite {
  siteType = WebtoonsWorker.siteType
  WorkerClass = Worker

  getUrl (): string {
    return WebtoonsWorker.url
  }

  getLoginUrl (): string {
    return this.getUrl()
  }

  getTestUrl (): string {
    return WebtoonsWorker.testUrl
  }
}
