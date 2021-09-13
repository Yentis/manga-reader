import { Worker } from '../classes/worker'
import { WorkerRequest } from '../classes/workerRequest'
import { doOperation } from './helper'
import { CatMangaWorker } from 'src/classes/sites/catmanga/catmangaWorker'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const worker = new CatMangaWorker(request.requestConfig)

  doOperation(request, worker)
})

export default Worker
