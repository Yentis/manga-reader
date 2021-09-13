import { WorkerRequest } from 'src/classes/workerRequest'
import { doOperation } from './helper'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'
import { Worker } from '../classes/worker'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const wordPressWorker = new WordPressWorker(request.siteType, request.requestConfig)

  doOperation(request, wordPressWorker)
})

export default Worker
