import { ContentType } from 'src/enums/contentTypeEnum'
import type ElectronWindow from 'src/interfaces/electronWindow'
import type { HttpRequest } from 'src/interfaces/httpRequest'
import type HttpResponse from 'src/interfaces/httpResponse'
import BaseRequest from './baseRequest'
import { COOKIE_NAMES } from 'src/services/requestService'

export default class ElectronRequest extends BaseRequest {
  mangaReader = (window as unknown as ElectronWindow).mangaReader

  constructor() {
    super()
    this.mangaReader.setCookieNames(COOKIE_NAMES).catch(console.error)
  }

  async sendRequest(request: HttpRequest, ignoreErrorStatus?: boolean): Promise<HttpResponse> {
    request.headers = request.headers ?? {}

    if (request.headers['Content-Type'] === ContentType.URLENCODED) {
      request.data = this.convertToUrlEncoded(request.data)
    }

    const response = await this.mangaReader.sendRequest(request)

    if (!ignoreErrorStatus && response.status >= 400) {
      throw Error(`Status Code ${response.status} ${response.statusText}`.trim())
    }

    return response
  }
}
