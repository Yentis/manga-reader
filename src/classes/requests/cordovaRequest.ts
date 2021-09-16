import { ContentType } from 'src/enums/contentTypeEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import HttpResponse from 'src/interfaces/httpResponse'
import BaseRequest from './baseRequest'

interface CordovaHttpResponse {
  status: number,
  data: string,
  error?: string,
  headers: Record<string, string>
}

interface HttpOptions {
  method: string,
  data?: Record<string, string>,
  headers?: Record<string, string>
}

interface CordovaHttp {
  plugin: {
    http: {
      sendRequest: (
        url: string,
        options: HttpOptions,
        callback: (response: CordovaHttpResponse) => void,
        error: (response: CordovaHttpResponse) => void
      ) => void,
      setDataSerializer: (type: string) => void
    }
  }
}

export default class CordovaRequest extends BaseRequest {
  sendRequest (request: HttpRequest): Promise<HttpResponse> {
    const plugins = ((cordova as unknown) as CordovaHttp).plugin
    const contentType = (request.headers || {})['Content-Type']

    if (contentType === ContentType.URLENCODED) {
      plugins.http.setDataSerializer('urlencoded')
    } else if (contentType === ContentType.JSON) {
      plugins.http.setDataSerializer('json')
    } else {
      plugins.http.setDataSerializer('utf8')
    }

    return new Promise((resolve, reject) => {
      plugins.http.sendRequest(
        request.url,
        {
          method: request.method.toLowerCase(),
          data: JSON.parse(request.data || '{}') as Record<string, string>,
          headers: request.headers
        },
        (response: CordovaHttpResponse) => {
          resolve({
            headers: response.headers,
            data: response.data
          })
        }, (error: CordovaHttpResponse) => {
          reject(Error(error.error || error.status.toString()))
        })
    })
  }
}
