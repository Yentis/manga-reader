import type { HttpRequest } from 'src/interfaces/httpRequest'
import type HttpResponse from 'src/interfaces/httpResponse'
import BaseRequest from './baseRequest'
import { ContentType } from 'src/enums/contentTypeEnum'
import { COOKIE_NAMES } from 'src/services/requestService'

const EXTENSION_ID = 'fjjhciamaplkcedanpphbkakidghlnji'

interface Runtime {
  sendMessage: (
    extensionId: string,
    message: HttpRequest | BasicRequest | string,
    options?: { includeTlsChannelId?: boolean },
  ) => Promise<HttpResponse | Error | string | undefined>
  lastError?: { message: string }
}

export interface BrowserHttpRequest extends HttpRequest {
  id: string
  name?: string
  value?: unknown
}

export interface BasicRequest {
  name: string
  value: unknown
}

function getRuntime(): Runtime | null {
  if (process.env.SERVER) return null
  const chromeWindow = window as unknown as Record<string, unknown>
  if (typeof chromeWindow.chrome !== 'object') return null
  const chrome = chromeWindow.chrome as Record<string, unknown>

  if (typeof chrome.runtime !== 'object') return null
  return chrome.runtime as Runtime
}

export async function hasExtension(): Promise<boolean> {
  const runtime = getRuntime()
  if (!runtime) return false

  const response = await runtime.sendMessage(EXTENSION_ID, 'ping')
  return response === '1.6.0'
}

export default class BrowserRequest extends BaseRequest {
  constructor() {
    super()

    const request: BasicRequest = {
      name: 'setCookieNames',
      value: COOKIE_NAMES,
    }

    getRuntime()?.sendMessage(EXTENSION_ID, request).catch(console.error)
  }

  async sendRequest(request: BrowserHttpRequest, ignoreErrorStatus?: boolean): Promise<HttpResponse> {
    request.headers = request.headers ?? {}

    if (request.headers['Content-Type'] === ContentType.URLENCODED && typeof request.data === 'string') {
      request.data = this.convertToUrlEncoded(request.data)
    }

    request.headers.cookie ??= ''

    const runtime = getRuntime()
    if (!runtime) return this.doFallbackRequest(request, ignoreErrorStatus)

    request.id = request.id ?? `${request.url}${Math.random().toString()}`
    const response = await runtime.sendMessage(EXTENSION_ID, request)

    if (runtime.lastError) {
      console.error(new Error(`Could not send extension message: ${runtime.lastError.message}`))
      return this.doFallbackRequest(request, ignoreErrorStatus)
    }

    if (response instanceof Error) throw response
    if (typeof response === 'string') throw new Error(`Invalid response received: ${response}`)

    if (response === undefined) {
      return this.doFallbackRequest(request, ignoreErrorStatus)
    }

    if (!ignoreErrorStatus && response.status >= 400) {
      throw new Error(`Status Code ${response.status} ${response.statusText}`.trim())
    }

    return response
  }

  private async doFallbackRequest(request: HttpRequest, ignoreErrorStatus?: boolean): Promise<HttpResponse> {
    const response = await fetch(request.url, {
      method: request.method,
      body: request.data,
      headers: request.headers,
    })

    if (!ignoreErrorStatus && response.status >= 400) {
      throw Error(`Status Code ${response.status} ${response.statusText}`.trim())
    }

    const headers: Record<string, string | string[]> = {}
    response.headers.forEach((value, key) => {
      const existingHeader = headers[key]
      if (existingHeader !== undefined) {
        if (Array.isArray(existingHeader)) {
          existingHeader.push(value)
          return
        }

        headers[key] = [existingHeader, value]
        return
      }

      headers[key] = value
    })
    const data = await response.text()

    return {
      headers,
      data,
      status: response.status,
      statusText: response.statusText,
    }
  }
}
