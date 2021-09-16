import { Worker } from '../classes/worker'
import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { doOperation } from './helper'
import { ArangScansWorker } from 'src/classes/sites/arang/arangscansWorker'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const worker = new ArangScansWorker()

  doOperation(request, worker)
})

export default Worker
