import { BaseSite } from '../baseSite'
import { BatotoWorker } from './batotoWorker'
import Worker from 'worker-loader!src/worker/site.worker'

export class Batoto extends BaseSite {
  siteType = BatotoWorker.siteType
  WorkerClass = Worker

  getTestUrl (): string {
    return BatotoWorker.testUrl
  }
}
