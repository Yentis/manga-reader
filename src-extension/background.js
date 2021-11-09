const FILTERS = { urls: ['https://*/*', 'http://*/*'] }
const responseListeners = new Map()
const requestListeners = new Map()
let cookieNames = ['cf_clearance', '__ddg1', '__ddg2', '__ddgid', '__ddgmark']

chrome.webRequest.onHeadersReceived.addListener((details) => {
  responseListeners.forEach((listener) => listener(details.url, details.responseHeaders))
}, FILTERS, ['responseHeaders', 'extraHeaders'])

chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
  requestListeners.forEach((listener) => listener(details.url, details.requestHeaders))
  return { requestHeaders: details.requestHeaders }
}, FILTERS, ['requestHeaders', 'extraHeaders', 'blocking'])

chrome.runtime.onMessageExternal.addListener((request, _sender, sendResponse) => {
  if (request.name === 'setCookieNames') {
    cookieNames = request.value
    sendResponse('ok')
    return
  }

  if (request === 'ping') {
    sendResponse('1.1')
    return
  }

  request.id = `${request.url}${Math.random().toString()}`

  doRequest(request).then((response) => {
    sendResponse(response)
  }).catch((error) => {
    console.error(error)
    sendResponse(error)
  }).finally(() => {
    responseListeners.delete(request.id)
    requestListeners.delete(request.id)
  })
})

async function doRequest (request) {
  const promises = [
    getResponseHeaders(request),
    setRequestHeaders(request)
  ]

  const response = await fetch(request.url, {
    method: request.method,
    body: request.data
  })

  const [headers] = await Promise.all(promises)
  const headerRecord = {}
  headers.forEach((header) => {
    const existingHeader = headerRecord[header.name]
    if (existingHeader) {
      if (Array.isArray(existingHeader)) {
        headerRecord[header.name].push(header.value)
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
    statusText: response.statusText
  }
}

function getResponseHeaders (request) {
  return new Promise((resolve) => {
    responseListeners.set(request.id, (url, responseHeaders) => {
      const adjustedUrl = getAdjustedUrl(request.url, url)
      if (url !== adjustedUrl) return

      resolve(responseHeaders)
    })
  })
}

async function setRequestHeaders (request) {
  const cookies = await new Promise((resolve) => {
    chrome.cookies.getAll({
      url: request.url
    }, resolve)
  })

  cookies.filter((cookie) => cookieNames.includes(cookie.name)).forEach((cookie) => {
    if (!cookie) return
    if (!request.headers.cookie) {
      request.headers.cookie = `${cookie.name}=${cookie.value}`
      return
    }

    request.headers.cookie += `;${cookie.name}=${cookie.value}`
  })

  return new Promise((resolve) => {
    requestListeners.set(request.id, (url, requestHeaders) => {
      const adjustedUrl = getAdjustedUrl(request.url, url)
      if (url !== adjustedUrl) return

      if (request.headers) {
        Object.keys(request.headers).forEach((header) => {
          const index = requestHeaders.findIndex((requestHeader) => {
            return requestHeader.name.toLowerCase() === header.toLowerCase()
          })
          const newHeader = { name: header, value: request.headers[header] }

          if (index !== -1) requestHeaders[index] = newHeader
          else requestHeaders.push(newHeader)
        })
      }

      resolve()
    })
  })
}

function getAdjustedUrl (url, detailUrl) {
  if (detailUrl.endsWith('/') && !url.endsWith('/')) return `${url}/`

  if (url.length === 0) return url
  if (url.endsWith('/') && !detailUrl.endsWith('/')) return url.substring(0, url.length - 1)

  return url
}
