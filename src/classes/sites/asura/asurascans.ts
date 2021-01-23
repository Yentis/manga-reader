import { BaseSite } from '../baseSite'
import { AsuraScansWorker } from './asurascansWorker'
import Worker from 'worker-loader!src/workers/asurascans.worker'

export class AsuraScans extends BaseSite {
  siteType = AsuraScansWorker.siteType
  WorkerClass = Worker

  getTestUrl (): string {
    return AsuraScansWorker.testUrl
  }
}
