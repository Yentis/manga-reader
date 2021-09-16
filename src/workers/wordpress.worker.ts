import { SiteWorkerMessage } from 'src/classes/workerMessage/siteMessage'
import { doOperation } from './helper'
import { WordPressWorker } from 'src/classes/sites/wordpress/wordpressWorker'
import { Worker } from '../classes/worker'
import { RequestType } from 'src/enums/workerEnum'

addEventListener('message', event => {
  const request = event.data as SiteWorkerMessage
  if (request.type.toUpperCase() in RequestType) return
  const wordPressWorker = new WordPressWorker(request.siteType)

  doOperation(request, wordPressWorker)
})

export default Worker
