/* eslint-disable @typescript-eslint/no-unused-vars */
import { BaseWorkerMessage } from './workerMessage/baseMessage'

export class Worker {
  onmessage: ((this: Worker, ev: {
    data: unknown
  }) => unknown) | undefined

  postMessage (_message: BaseWorkerMessage): void {
    // Do nothing
  }
}
