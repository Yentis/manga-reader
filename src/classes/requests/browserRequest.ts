import HttpRequest from 'src/interfaces/httpRequest'
import HttpResponse from 'src/interfaces/httpResponse'
import BaseRequest from './baseRequest'
import axios from 'axios'
import { ContentType } from 'src/enums/contentTypeEnum'

export default class BrowserRequest extends BaseRequest {
  async sendRequest (request: HttpRequest): Promise<HttpResponse> {
    const headers = request.headers || {}
    if (headers['Content-Type'] === ContentType.URLENCODED) {
      request.data = this.convertToUrlEncoded(request.data)
    }

    const response = await axios({
      method: request.method,
      url: request.url,
      data: request.data,
      headers: request.headers
    })

    return {
      headers: response.headers as Record<string, string>,
      data: response.data as string
    }
  }
}
