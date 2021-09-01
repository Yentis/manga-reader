import { BaseSite } from '../baseSite'
import { AsuraScansWorker } from './asurascansWorker'
import Worker from 'worker-loader!src/worker/site.worker'
import { SiteType } from 'src/enums/siteEnum'
import PQueue from 'p-queue'

export class AsuraScans extends BaseSite {
  siteType: SiteType
  WorkerClass = Worker

  constructor (siteType: SiteType) {
    super()
    this.siteType = siteType

    if (siteType === SiteType.AsuraScans) {
      this.requestQueue = new PQueue({ interval: 2000, intervalCap: 1 })
    }
  }

  getTestUrl (): string {
    return AsuraScansWorker.getTestUrl(this.siteType)
  }
}
