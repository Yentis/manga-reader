import { Worker } from '../classes/worker'
import { WorkerRequest } from '../classes/workerRequest'
import { doOperation } from './helper'
import { ArangScansWorker } from 'src/classes/sites/arang/arangscansWorker'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const worker = new ArangScansWorker(request.requestConfig)

  doOperation(request, worker)
})

export default Worker
