import { ContentType } from 'src/enums/contentTypeEnum'
import ElectronWindow from 'src/interfaces/electronWindow'
import HttpRequest from 'src/interfaces/httpRequest'
import HttpResponse from 'src/interfaces/httpResponse'
import BaseRequest from './baseRequest'

export default class ElectronRequest extends BaseRequest {
  sendRequest (request: HttpRequest): Promise<HttpResponse> {
    const mangaReader = (window as unknown as ElectronWindow).mangaReader
    const headers = request.headers || {}

    if (headers['Content-Type'] === ContentType.URLENCODED) {
      request.data = this.convertToUrlEncoded(request.data)
    }

    return mangaReader.sendRequest(request)
  }
}
