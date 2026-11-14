// @ts-check
/* eslint-disable @typescript-eslint/explicit-function-return-type */

/**
 * @typedef {Map<String, (url: String, headers: chrome.webRequest.HttpHeader[]) => void>} HttpListener
 * @typedef {import('../src/classes/requests/browserRequest').BrowserHttpRequest} HttpRequest
 * @typedef {import('../src/classes/requests/browserRequest.ts').BasicRequest} BasicRequest
 * @typedef {import('../src/interfaces/httpResponse')} HttpResponse
 */

const FILTERS = { urls: ['https://*/*', 'http://*/*'] }

/** @type {HttpListener} */
const responseListeners = new Map()

/** @type string[] */
let cookieNames = []

/** @type Set<number> */
let requestIds = new Set()

browser.webRequest.onHeadersReceived.addListener(
  (details) => {
    const responseHeaders = details.responseHeaders ?? []
    responseListeners.forEach((listener) => listener(details.url, responseHeaders))
    return undefined
  },
  FILTERS,
  ['responseHeaders', 'extraHeaders'],
)

browser.runtime.onMessageExternal.addListener((request, _sender, sendResponse) => {
  onRequest(request, sendResponse)

  return true
})

/**
 * @param {HttpRequest | BasicRequest | String} request
 * @param {(response?: unknown) => void} sendResponse
 */
function onRequest(request, sendResponse) {
  if (typeof request === 'string') {
    if (request === 'ping') {
      sendResponse(browser.runtime.getManifest().version)
    }

    sendResponse(new Error(`Unknown request: ${request}`))
    return
  }

  if (request.name === 'setCookieNames' && Array.isArray(request.value)) {
    cookieNames = request.value
    sendResponse('ok')

    return
  }

  if (!('id' in request)) {
    return
  }

  doRequest(request)
    .then((response) => sendResponse(response))
    .catch((error) => {
      console.error(error)
      sendResponse(error)
    })
    .finally(() => {
      responseListeners.delete(request.id)
    })
}

/**
 *
 * @param {HttpRequest} request
 * @returns {Promise<HttpResponse>}
 */
async function doRequest(request) {
  const id = getNextId()

  try {
    const requestHeaders = request.headers ?? {}
    const url = new URL(request.url)

    await setRequestCookies(request)
    await browser.declarativeNetRequest.updateDynamicRules({
      addRules: [
        {
          id,
          condition: {
            initiatorDomains: [chrome.runtime.id],
            urlFilter: request.url,
          },
          action: {
            type: 'modifyHeaders',
            requestHeaders: Object.entries(requestHeaders).map(([header, value]) => {
              if (header.toLowerCase() === 'cookie') {
                return {
                  header,
                  operation: 'append',
                  value,
                }
              }

              return {
                header,
                operation: 'set',
                value,
              }
            }),
          },
        },
      ],
    })

    const responsePromise = getResponseHeaders(request)
    const response = await fetch(request.url, {
      method: request.method,
      body: request.data,
      redirect: 'manual',
    })

    const headers = await responsePromise
    if (response.type === 'opaqueredirect') {
      const locationHeader = headers.find((header) => header.name.toLowerCase() === 'location')
      let newUrl = locationHeader?.value
      if (!newUrl) throw new Error('No location found for redirect')

      if (newUrl.startsWith('/')) {
        newUrl = `${url.origin}${newUrl}`
      }

      request.url = newUrl
      return doRequest(request)
    }

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

    let data

    if (request.headers?.responseType === 'arraybuffer') {
      const blob = await response.blob()

      const promise = new Promise((resolve, reject) => {
        try {
          const reader = new FileReader()
          reader.onload = () => {
            resolve(reader.result)
          }
          reader.readAsDataURL(blob)
        } catch (e) {
          reject(e)
        }
      })

      const base64 = await promise
      data = base64.substring(base64.indexOf(',') + 1)
    } else {
      data = await response.text()
    }

    return {
      headers: headerRecord,
      data,
      status: response.status,
      statusText: response.statusText,
    }
  } finally {
    await removeRule(id)
  }
}

/**
 * @returns {number}
 */
function getNextId() {
  let id = 1
  while (requestIds.has(id)) id++

  requestIds.add(id)
  return id
}

/**
 * @param {number} id
 * @returns {Promise<void>}
 */
async function removeRule(id) {
  await browser.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [id] })
  requestIds.delete(id)
}

/**
 *
 * @param {HttpRequest} request
 * @returns {Promise<void>}
 */
async function setRequestCookies(request) {
  const cookies = await getCookies(request)

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
 * @param {HttpRequest} request
 * @returns {Promise<chrome.cookies.Cookie[]>}
 */
async function getCookies(request) {
  const partitionCookies = browser.cookies.getAll({ partitionKey: {} })
  const regularCookies = browser.cookies.getAll({ url: request.url })
  const [partitionArray, cookieArray] = await Promise.all([partitionCookies, regularCookies])

  // topLevelSite filtering doesn't work so we do it manually
  partitionArray.forEach((cookie) => {
    const topLevelSite = cookie.partitionKey?.topLevelSite?.replace('www.', '')
    if (!topLevelSite) return

    if (request.url.replace('www.', '').includes(topLevelSite)) {
      cookieArray.push(cookie)
    }
  })

  return cookieArray
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
