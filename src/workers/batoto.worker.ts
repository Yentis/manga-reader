import { Worker } from '../classes/worker'
import { WorkerRequest } from '../classes/workerRequest'
import { BatotoWorker } from '../classes/sites/batoto/batotoworker'
import { doOperation } from './helper'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const worker = new BatotoWorker(request.requestConfig)

  doOperation(request, worker)
})

export default Worker
