import { Worker } from '../classes/worker'
import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { BatotoWorker } from '../classes/sites/batoto/batotoWorker'
import { doOperation } from './helper'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const worker = new BatotoWorker()

  doOperation(request, worker)
})

export default Worker
