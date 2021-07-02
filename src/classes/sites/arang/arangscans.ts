import { BaseSite } from '../baseSite'
import { ArangScansWorker } from './arangscansWorker'
import Worker from 'worker-loader!src/workers/arangscans.worker'

export class ArangScans extends BaseSite {
  siteType = ArangScansWorker.siteType
  WorkerClass = Worker

  getTestUrl (): string {
    return ArangScansWorker.testUrl
  }
}
