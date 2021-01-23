/* eslint-disable @typescript-eslint/ban-ts-comment */

import { BaseWorker } from '../classes/sites/baseWorker'
import { WorkerRequest } from '../classes/workerRequest'
import { RequestType } from '../enums/workerEnum'

export function doOperation (request: WorkerRequest, worker: BaseWorker) {
  onRequest(request, worker)
    // @ts-ignore
    .then(result => postMessage(result))
    // @ts-ignore
    .catch(error => postMessage(Error(error)))
    .finally(() => close())
}

export function onRequest (request: WorkerRequest, worker: BaseWorker): Promise<unknown> {
  return new Promise(resolve => {
    switch (request.type) {
      case RequestType.READ_URL:
        worker.readUrl(request.data.get('url') as string).then(result => {
          resolve(result)
        }).catch(error => {
          resolve(Error(error))
        })
        break
      case RequestType.SEARCH:
        worker.search(request.data.get('query') as string).then(result => {
          resolve(result)
        }).catch(error => {
          resolve(Error(error))
        })
        break
      case RequestType.SYNC_CHAPTER:
        worker.syncReadChapter(request.data.get('mangaId') as number, request.data.get('chapterNum') as number).then(result => {
          resolve(result)
        }).catch(error => {
          resolve(Error(error))
        })
    }
  })
}
