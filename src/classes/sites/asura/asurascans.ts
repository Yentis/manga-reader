import { BaseSite } from '../baseSite'
import { AsuraScansWorker } from './asurascansWorker'
import Worker from 'worker-loader!src/workers/asurascans.worker'
import { SiteType } from 'src/enums/siteEnum'
import PQueue from 'p-queue'

export class AsuraScans extends BaseSite {
  siteType: SiteType
  WorkerClass = Worker
  requestQueue = new PQueue({ interval: 1000, intervalCap: 1 })

  constructor (siteType: SiteType) {
    super()
    this.siteType = siteType
  }

  getTestUrl (): string {
    return AsuraScansWorker.getTestUrl(this.siteType)
  }
}
