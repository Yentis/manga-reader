/* eslint-disable @typescript-eslint/no-unused-vars */
import { WorkerRequest } from './workerRequest'

export class Worker {
  onmessage: ((this: Worker, ev: {
    data: unknown
  }) => unknown) | undefined

  postMessage (_message: WorkerRequest): void {
    // Do nothing
  }
}
