/* eslint-disable @typescript-eslint/ban-ts-comment */

import { WorkerRequest } from 'src/classes/workerRequest'
import { doOperation } from './helper'
import { KitsuRequestType } from 'src/enums/workerEnum'
import { Worker } from 'src/classes/worker'
import { KitsuWorker } from 'src/classes/sites/kitsu/kitsuWorker'

addEventListener('message', event => {
  const request = event.data as WorkerRequest
  const kitsuWorker = new KitsuWorker(request.data.get('token') as string, request.requestConfig)

  switch (request.type) {
    case KitsuRequestType.USER_ID:
      kitsuWorker.getUserId().then(result => {
        // @ts-ignore
        postMessage(result)
      }).catch(error => {
        // @ts-ignore
        postMessage(Error(error))
      })
      return
    case KitsuRequestType.MANGA_SLUG:
      kitsuWorker.searchMangaSlug(request.data.get('url') as string).then(result => {
        // @ts-ignore
        postMessage(result)
      }).catch(error => {
        // @ts-ignore
        postMessage(Error(error))
      })
      return
    case KitsuRequestType.LIBRARY_ID:
      kitsuWorker.getLibraryId(request.data.get('mangaId') as string, request.data.get('userId') as string).then(result => {
        // @ts-ignore
        postMessage(result)
      }).catch(error => {
        // @ts-ignore
        postMessage(Error(error))
      })
      return
    case KitsuRequestType.LOGIN:
      kitsuWorker.doLogin({ username: request.data.get('username') as string, password: request.data.get('password') as string }).then(result => {
        // @ts-ignore
        postMessage(result)
      }).catch(error => {
        // @ts-ignore
        postMessage(Error(error))
      })
      return
  }

  doOperation(request, kitsuWorker)
})

export default Worker
