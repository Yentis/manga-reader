/* eslint-disable @typescript-eslint/ban-ts-comment */

import { BaseWorkerMessage } from 'src/classes/workerMessage/baseMessage'
import { BaseWorker } from '../classes/sites/baseWorker'
import { RequestData, SiteRequestType } from '../enums/workerEnum'

export function doOperation (request: BaseWorkerMessage, worker: BaseWorker) {
  handlePromise(request.type, onRequest(request, worker))
}

export function onRequest (request: BaseWorkerMessage, worker: BaseWorker): Promise<unknown> {
  return new Promise(resolve => {
    switch (request.type) {
      case SiteRequestType.READ_URL:
        worker.readUrl(request.data.get('url') as string).then(result => {
          resolve(result)
        }).catch(error => {
          resolve(Error(error))
        })
        break
      case SiteRequestType.SEARCH:
        worker.search(request.data.get('query') as string).then(result => {
          resolve(result)
        }).catch(error => {
          resolve(Error(error))
        })
        break
      case SiteRequestType.SYNC_CHAPTER:
        worker.syncReadChapter(request.data.get('mangaId') as number, request.data.get('chapterNum') as number).then(result => {
          resolve(result)
        }).catch(error => {
          resolve(Error(error))
        })
    }
  })
}

export function handlePromise (type: string, promise: Promise<unknown>) {
  const data = new Map()

  promise.then((result) => {
    if (result instanceof Error) {
      data.set(RequestData.ERROR, result)
    } else {
      data.set(RequestData.DATA, result)
    }

    // @ts-ignore
    postMessage(new BaseWorkerMessage(type, data))
  }).catch((error) => {
    data.set(RequestData.ERROR, Error(error))
    // @ts-ignore
    postMessage(new BaseWorkerMessage(type, data))
  }).finally(() => close())
}
