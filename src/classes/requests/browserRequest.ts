import HttpRequest from 'src/interfaces/httpRequest'
import HttpResponse from 'src/interfaces/httpResponse'
import BaseRequest from './baseRequest'
import { ContentType } from 'src/enums/contentTypeEnum'

const EXTENSION_ID = 'fjjhciamaplkcedanpphbkakidghlnji'

interface Runtime {
  sendMessage: (
    extensionId: string,
    message: HttpRequest | string,
    responseCallback: (response?: HttpResponse | Error | string) => void
  ) => void
  lastError?: { message: string }
}

export interface BrowserHttpRequest extends HttpRequest {
  id: string
  name?: string
  value?: unknown
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

  return new Promise((resolve) => {
    runtime.sendMessage(EXTENSION_ID, 'ping', (response) => {
      if (runtime.lastError) {
        resolve(false)
        return
      }

      resolve(response === '1.5')
    })
  })
}

export default class BrowserRequest extends BaseRequest {
  async sendRequest(request: HttpRequest, ignoreErrorStatus?: boolean): Promise<HttpResponse> {
    request.headers = request.headers || {}

    if (request.headers['Content-Type'] === ContentType.URLENCODED && typeof request.data === 'string') {
      request.data = this.convertToUrlEncoded(request.data)
    }

    if (!request.headers.cookie) {
      request.headers.cookie = ''
    }

    const runtime = getRuntime()
    if (!runtime) return this.doFallbackRequest(request, ignoreErrorStatus)

    const result = await new Promise<HttpResponse | undefined>((resolve, reject) => {
      runtime.sendMessage(EXTENSION_ID, request, (response) => {
        if (runtime.lastError) {
          console.error(Error(`Could not send extension message: ${runtime.lastError.message}`))
          resolve(undefined)
          return
        }

        if (response instanceof Error) {
          reject(response)
          return
        }

        if (typeof response === 'string') {
          reject(Error(`Invalid response received: ${response}`))
          return
        }

        if (!response) {
          resolve(response)
          return
        }

        if (!ignoreErrorStatus && response.status >= 400) {
          reject(Error(`Status Code ${response.status} ${response.statusText}`.trim()))
          return
        }

        resolve(response)
      })
    })

    return result || this.doFallbackRequest(request, ignoreErrorStatus)
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
      if (existingHeader) {
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
