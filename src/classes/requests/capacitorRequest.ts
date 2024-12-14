import { ContentType } from 'src/enums/contentTypeEnum'
import HttpRequest from 'src/interfaces/httpRequest'
import HttpResponse from 'src/interfaces/httpResponse'
import BaseRequest from './baseRequest'
import { CapacitorCookies, CapacitorHttp } from '@capacitor/core'

const COOKIE_NAMES = ['cf_clearance', '__ddg1', '__ddg2', '__ddgid', '__ddgmark']

export default class CapacitorRequest extends BaseRequest {
  async sendRequest(request: HttpRequest, ignoreErrorStatus?: boolean): Promise<HttpResponse> {
    const headers = request.headers || {}

    if (headers['Content-Type'] === ContentType.URLENCODED) {
      request.data = this.convertToUrlEncoded(request.data)
    }

    const cookies = await CapacitorCookies.getCookies({ url: request.url })

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

    const capacitorResponse = await CapacitorHttp.request({
      url: request.url,
      method: request.method,
      data: request.data,
      headers: request.headers,
    })

    const data = typeof capacitorResponse.data === 'string'
      ? capacitorResponse.data
      : JSON.stringify(capacitorResponse.data)

    const response: HttpResponse = {
      headers: capacitorResponse.headers,
      data,
      status: capacitorResponse.status,
      statusText: '',
    }

    if (!ignoreErrorStatus && response.status >= 400) {
      throw Error(`Status Code ${response.status} ${response.statusText}`.trim())
    }

    return response
  }
}
