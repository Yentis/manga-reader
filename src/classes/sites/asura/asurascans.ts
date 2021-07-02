import { BaseSite } from '../baseSite'
import { AsuraScansWorker } from './asurascansWorker'
import Worker from 'worker-loader!src/workers/asurascans.worker'
import { SiteType } from 'src/enums/siteEnum'

export class AsuraScans extends BaseSite {
  siteType: SiteType
  WorkerClass = Worker

  constructor (siteType: SiteType) {
    super()
    this.siteType = siteType
  }

  getTestUrl (): string {
    return AsuraScansWorker.getTestUrl(this.siteType)
  }
}
