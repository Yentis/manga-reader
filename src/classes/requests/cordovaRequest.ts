import { ContentType } from 'src/enums/contentTypeEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import HttpResponse from 'src/interfaces/httpResponse'
import BaseRequest, { getCookies } from './baseRequest'

interface CordovaHttpResponse {
  status: number,
  data: string,
  error?: string,
  headers: Record<string, string>
}

interface HttpOptions {
  method: string,
  data?: string,
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
  },
  plugins: {
    CookiesPlugin: {
      getCookie: (
        url: string,
        onSuccess: (cookieString: string | null) => void,
        onFailure: (error: Error) => void
      ) => void
    }
  }
}

const COOKIE_NAMES = ['cf_clearance', '__ddg1', '__ddg2', '__ddgid', '__ddgmark']

export default class CordovaRequest extends BaseRequest {
  constructor () {
    super()
    const plugins = ((cordova as unknown) as CordovaHttp).plugin
    plugins.http.setDataSerializer('utf8')
  }

  async sendRequest (request: HttpRequest, ignoreErrorStatus?: boolean): Promise<HttpResponse> {
    const localCordova = (cordova as unknown) as CordovaHttp
    const headers = request.headers || {}

    if (headers['Content-Type'] === ContentType.URLENCODED) {
      request.data = this.convertToUrlEncoded(request.data)
    }

    const cookieString = await new Promise<string | null>((resolve, reject) => {
      localCordova.plugins.CookiesPlugin.getCookie(request.url, resolve, reject)
    })
    const cookies = getCookies(cookieString || '')

    COOKIE_NAMES.map((name) => {
      return { name, value: cookies[name] }
    }).forEach((cookie) => {
      if (!cookie.value) return
      if (!headers.cookie) {
        headers.cookie = `${cookie.name}=${cookie.value}`
        return
      }

      headers.cookie += `;${cookie.name}=${cookie.value}`
    })

    request.headers = headers
    const response = await new Promise<HttpResponse>((resolve) => {
      const onResponse = (response: CordovaHttpResponse) => {
        resolve({
          headers: response.headers,
          data: response.data || response.error || '',
          status: response.status,
          statusText: ''
        })
      }

      localCordova.plugin.http.sendRequest(
        request.url,
        {
          method: request.method.toLowerCase(),
          data: request.data,
          headers: request.headers
        },
        onResponse,
        onResponse
      )
    })

    if (!ignoreErrorStatus && response.status >= 400) {
      throw Error(`Status Code ${response.status} ${response.statusText}`.trim())
    }

    return response
  }
}
