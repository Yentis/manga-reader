export class BaseWorkerMessage {
  type: string
  data: Map<string, unknown>

  constructor (type: string, data: Map<string, string>) {
    this.type = type
    this.data = data
  }
}
