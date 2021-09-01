import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/worker/site.worker'
import { GenkanioWorker } from './genkanioWorker'

export class Genkanio extends BaseSite {
  siteType = GenkanioWorker.siteType
  WorkerClass = Worker

  hasSearch (): boolean {
    return false
  }

  getTestUrl (): string {
    return GenkanioWorker.testUrl
  }
}
