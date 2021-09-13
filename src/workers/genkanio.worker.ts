import { Worker } from '../classes/worker'
import { WorkerRequest } from '../classes/workerRequest'
import { GenkanioWorker } from '../classes/sites/genkanio/genkanioWorker'
import { doOperation } from './helper'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const worker = new GenkanioWorker(request.requestConfig)

  doOperation(request, worker)
})

export default Worker
