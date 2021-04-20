import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/workers/genkanio.worker'
import { GenkanioWorker } from './genkanioWorker'

export class Genkanio extends BaseSite {
  siteType = GenkanioWorker.siteType
  WorkerClass = Worker

  getTestUrl (): string {
    return GenkanioWorker.testUrl
  }
}
