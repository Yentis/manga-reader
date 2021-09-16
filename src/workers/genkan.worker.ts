import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { doOperation } from './helper'
import { Worker } from 'src/classes/worker'
import { GenkanWorker } from 'src/classes/sites/genkan/genkanWorker'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const genkanWorker = new GenkanWorker(request.siteType)

  doOperation(request, genkanWorker)
})

export default Worker
