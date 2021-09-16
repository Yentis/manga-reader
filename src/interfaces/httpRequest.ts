import { Method } from 'axios'

export default interface HttpRequest {
  method: Method,
  url: string,
  data?: string,
  headers?: Record<string, string>
}
