// @ts-check

/**
 * @typedef {Map<String, (url: String, headers: chrome.webRequest.HttpHeader[]) => void>} HttpListener
 * @typedef {import('../src/classes/requests/browserRequest').BrowserHttpRequest} HttpRequest
 * @typedef {import('../src/interfaces/httpResponse')} HttpResponse
 */

const FILTERS = { urls: ['https://*/*', 'http://*/*'] }

/** @type {HttpListener} */
const responseListeners = new Map()

/** @type {HttpListener} */
const requestListeners = new Map()

let cookieNames = ['cf_clearance', '__ddg1', '__ddg2', '__ddgid', '__ddgmark']

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    const responseHeaders = details.responseHeaders ?? []
    responseListeners.forEach((listener) => listener(details.url, responseHeaders))
  },
  FILTERS,
  ['responseHeaders', 'extraHeaders']
)

chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    const requestHeaders = details.requestHeaders ?? []
    requestListeners.forEach((listener) => listener(details.url, requestHeaders))

    return { requestHeaders }
  },
  FILTERS,
  ['requestHeaders', 'extraHeaders', 'blocking']
)

chrome.runtime.onMessageExternal.addListener((request, _sender, sendResponse) => {
  onRequest(request, sendResponse)
})

/**
 * @param {HttpRequest | String} request
 * @param {(response?: unknown) => void} sendResponse
 */
function onRequest(request, sendResponse) {
  if (typeof request === 'string') {
    if (request === 'ping') {
      sendResponse(chrome.runtime.getManifest().version)
    }

    sendResponse(new Error(`Unknown request: ${request}`))
    return
  }

  if (request.name === 'setCookieNames' && Array.isArray(request.value)) {
    /** @type {string[]} */
    const newCookieNames = request.value
    cookieNames = newCookieNames
    sendResponse('ok')

    return
  }

  request.id = `${request.url}${Math.random().toString()}`

  doRequest(request)
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error(error)
      sendResponse(error)
    })
    .finally(() => {
      responseListeners.delete(request.id)
      requestListeners.delete(request.id)
    })
}

/**
 *
 * @param {HttpRequest} request
 * @returns {Promise<HttpResponse>}
 */
async function doRequest(request) {
  const responsePromise = getResponseHeaders(request)
  const requestPromise = setRequestHeaders(request, await getCookies(request))

  /** @type {Promise<void | chrome.webRequest.HttpHeader[]>[]} */
  const promises = [responsePromise, requestPromise]

  const response = await fetch(request.url, {
    method: request.method,
    body: request.data,
  })

  await Promise.all(promises)
  const headers = await responsePromise

  /** @type {Record<string, string | string[]>} */
  const headerRecord = {}

  headers.forEach((header) => {
    if (!header.value) return

    const existingHeader = headerRecord[header.name]
    if (existingHeader) {
      if (Array.isArray(existingHeader)) {
        existingHeader.push(header.value)
        return
      }

      headerRecord[header.name] = [existingHeader, header.value]
      return
    }

    headerRecord[header.name] = header.value
  })

  const data = await response.text()

  return {
    headers: headerRecord,
    data,
    status: response.status,
    statusText: response.statusText,
  }
}

/**
 *
 * @param {HttpRequest} request
 * @returns {Promise<chrome.webRequest.HttpHeader[]>}
 */
function getResponseHeaders(request) {
  /** @type {chrome.webRequest.HttpHeader[] | undefined} */
  let receivedResponseHeaders

  /** @type {((headers: chrome.webRequest.HttpHeader[]) => void) | undefined} */
  let resolveCallback

  responseListeners.set(request.id, (url, responseHeaders) => {
    const adjustedUrl = getAdjustedUrl(request.url, url)
    if (url !== adjustedUrl) return

    receivedResponseHeaders = responseHeaders
    resolveCallback?.(responseHeaders)
  })

  return new Promise((resolve) => {
    if (receivedResponseHeaders) {
      resolve(receivedResponseHeaders)
      return
    }

    resolveCallback = resolve
  })
}

/**
 *
 * @param {HttpRequest} request
 * @param {chrome.cookies.Cookie[]} cookies
 * @returns {Promise<void>}
 */
function setRequestHeaders(request, cookies) {
  cookies
    .filter((cookie) => cookieNames.includes(cookie.name))
    .forEach((cookie) => {
      if (!cookie) return
      request.headers = request.headers ?? {}

      if (!request.headers.cookie) {
        request.headers.cookie = `${cookie.name}=${cookie.value}`
        return
      }

      request.headers.cookie += `;${cookie.name}=${cookie.value}`
    })

  /** @type {chrome.webRequest.HttpHeader[] | undefined} */
  let receivedRequestHeaders

  /** @type {(() => void) | undefined} */
  let resolveCallback

  requestListeners.set(request.id, (url, requestHeaders) => {
    const adjustedUrl = getAdjustedUrl(request.url, url)
    if (url !== adjustedUrl) return

    if (request.headers) {
      Object.keys(request.headers).forEach((header) => {
        const index =
          requestHeaders?.findIndex((requestHeader) => {
            return requestHeader.name.toLowerCase() === header.toLowerCase()
          }) ?? -1

        const newHeader = {
          name: header,
          value: request.headers?.[header],
        }

        if (index !== -1) requestHeaders[index] = newHeader
        else requestHeaders.push(newHeader)
      })
    }

    receivedRequestHeaders = requestHeaders
    resolveCallback?.()
  })

  return new Promise((resolve) => {
    if (receivedRequestHeaders) {
      resolve()
      return
    }

    resolveCallback = resolve
  })
}

/**
 * @param {HttpRequest} request
 * @returns {Promise<chrome.cookies.Cookie[]>}
 */
async function getCookies(request) {
  // @ts-expect-error partitionKey doesn't exist in the types
  const partitionCookies = getCookiesBase({ partitionKey: { topLevelSite: request.url } })
  const regularCookies = getCookiesBase({ url: request.url })

  const cookieArrays = await Promise.all([partitionCookies, regularCookies])
  return cookieArrays.flat()
}

/**
 * @param {chrome.cookies.GetAllDetails} options
 * @returns {Promise<chrome.cookies.Cookie[]>}
 */
function getCookiesBase(options) {
  return new Promise((resolve) => {
    chrome.cookies.getAll(options, resolve)
  })
}

/**
 *
 * @param {String} url
 * @param {String} detailUrl
 * @returns
 */
function getAdjustedUrl(url, detailUrl) {
  if (detailUrl.endsWith('/') && !url.endsWith('/')) return `${url}/`

  if (url.length === 0) return url
  if (url.endsWith('/') && !detailUrl.endsWith('/')) return url.substring(0, url.length - 1)

  return url
}
