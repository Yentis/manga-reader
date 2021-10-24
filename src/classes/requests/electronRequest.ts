import { ContentType } from 'src/enums/contentTypeEnum'
import ElectronWindow from 'src/interfaces/electronWindow'
import HttpRequest from 'src/interfaces/httpRequest'
import HttpResponse from 'src/interfaces/httpResponse'
import BaseRequest from './baseRequest'

export default class ElectronRequest extends BaseRequest {
  async sendRequest (request: HttpRequest, ignoreErrorStatus?: boolean): Promise<HttpResponse> {
    const mangaReader = (window as unknown as ElectronWindow).mangaReader
    request.headers = request.headers || {}

    if (request.headers['Content-Type'] === ContentType.URLENCODED) {
      request.data = this.convertToUrlEncoded(request.data)
    }

    const response = await mangaReader.sendRequest(request)

    if (!ignoreErrorStatus && response.status >= 400) {
      throw Error(`Status Code ${response.status} ${response.statusText}`.trim())
    }

    return response
  }
}
