import { Worker } from '../classes/worker'
import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { AsuraScansWorker } from '../classes/sites/asura/asurascansWorker'
import { doOperation } from './helper'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const worker = new AsuraScansWorker(request.siteType)

  doOperation(request, worker)
})

export default Worker
