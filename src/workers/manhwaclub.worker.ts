import { ManhwaClubWorker } from 'src/classes/sites/manhwaclub/manhwaclubWorker'
import { Worker } from '../classes/worker'
import { WorkerRequest } from '../classes/workerRequest'
import { doOperation } from './helper'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const worker = new ManhwaClubWorker(request.requestConfig)

  doOperation(request, worker)
})

export default Worker
