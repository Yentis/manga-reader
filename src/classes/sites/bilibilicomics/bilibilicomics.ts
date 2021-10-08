import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/workers/bilibilicomics.worker'
import { BiliBiliComicsWorker } from './bilibilicomicsWorker'

export class BiliBiliComics extends BaseSite {
  siteType = BiliBiliComicsWorker.siteType
  WorkerClass = Worker

  getTestUrl (): string {
    return BiliBiliComicsWorker.testUrl
  }
}
