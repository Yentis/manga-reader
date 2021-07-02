import { Worker } from '../classes/worker'
import { WorkerRequest } from '../classes/workerRequest'
import { AsuraScansWorker } from '../classes/sites/asura/asurascansWorker'
import { doOperation } from './helper'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const worker = new AsuraScansWorker(request.siteType, request.requestConfig)

  doOperation(request, worker)
})

export default Worker
