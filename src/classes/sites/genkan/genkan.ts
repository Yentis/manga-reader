import { SiteType } from '../../../enums/siteEnum'
import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/worker/site.worker'
import { GenkanWorker } from './genkanWorker'

export class Genkan extends BaseSite {
  siteType: SiteType
  WorkerClass = Worker

  constructor (siteType: SiteType) {
    super()
    this.siteType = siteType
  }

  getTestUrl (): string {
    return GenkanWorker.getTestUrl(this.siteType)
  }
}
