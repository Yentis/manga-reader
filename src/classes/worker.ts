/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { WorkerRequest } from './workerRequest'

export class Worker {
  onmessage: ((this: Worker, ev: { data: any }) => any) | undefined

  postMessage (_message: WorkerRequest): void {
    // Do nothing
  }
}
