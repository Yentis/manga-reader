import { AxiosRequestConfig } from 'axios'
import { LooseDictionary } from 'quasar/dist/types'
import { LinkingSiteType } from 'src/enums/linkingSiteEnum'
import { SiteType } from 'src/enums/siteEnum'
import { BaseSite } from './sites/baseSite'

export class WorkerRequest {
  type: string
  data: Map<string, unknown>
  siteType: SiteType | LinkingSiteType
  requestConfig: AxiosRequestConfig | undefined
  platform: LooseDictionary | undefined

  constructor (type: string, data: Map<string, string>, site: BaseSite, platform: LooseDictionary | undefined = undefined) {
    this.type = type
    this.data = data
    this.siteType = site.siteType
    this.requestConfig = site.requestConfig
    this.platform = platform
  }
}
