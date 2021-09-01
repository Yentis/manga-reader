import { SiteType } from '../../../enums/siteEnum'
import { BaseSite } from '../baseSite'
import Worker from 'worker-loader!src/worker/site.worker'
import { WordPressWorker } from './wordpressWorker'
import PQueue from 'p-queue'

export class WordPress extends BaseSite {
  siteType: SiteType;
  WorkerClass = Worker

  constructor (siteType: SiteType) {
    super()
    this.siteType = siteType

    if (siteType === SiteType.HiperDEX) {
      this.requestQueue = new PQueue({ interval: 1000, intervalCap: 1 })
    }
  }

  getUrl (): string {
    return WordPressWorker.getUrl(this.siteType)
  }

  getLoginUrl (): string {
    return this.getUrl()
  }

  getTestUrl (): string {
    return WordPressWorker.getTestUrl(this.siteType)
  }
}
