import type { Event } from 'electron'
import { app, BrowserWindow, ipcMain, Menu, net, session } from 'electron'
import { ElectronBlocker } from '@ghostery/adblocker-electron'
import qs from 'qs'
import fetch from 'isomorphic-fetch'
import moment from 'moment'
import path from 'path'
import type { HttpRequest } from 'src/interfaces/httpRequest'
import type HttpResponse from 'src/interfaces/httpResponse'
import { fileURLToPath } from 'node:url'

const currentDir = fileURLToPath(new URL('.', import.meta.url))

let mainWindow: BrowserWindow | undefined
let queryString: qs.ParsedQs | undefined
let oauthType: string | undefined

app.userAgentFallback =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) old-airport-include/1.0.0 Chrome Electron/7.1.7 Safari/537.36'

async function createWindow(): Promise<void> {
  const menu = Menu.buildFromTemplate([
    {
      label: '<',
      click: (_item, window): void => {
        if (window instanceof BrowserWindow) {
          window.webContents.navigationHistory.goBack()
        }
      },
    },
    {
      label: '>',
      click: (_item, window): void => {
        if (window instanceof BrowserWindow) {
          window.webContents.navigationHistory.goForward()
        }
      },
    },
    {
      label: 'Manga list',
      click: (_item, window): void => {
        if (window instanceof BrowserWindow) {
          window.webContents.navigationHistory.goToIndex(0)
        }
      },
    },
    {
      label: '',
      role: 'toggleDevTools',
      visible: false,
    },
  ])

  const nodeIntegration = process.env.QUASAR_NODE_INTEGRATION === 'true'

  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 900,
    height: 800,
    minWidth: 900,
    title: 'Manga Reader',
    useContentSize: true,
    webPreferences: {
      // Change from /quasar.conf.js > electron > nodeIntegration;
      // More info: https://quasar.dev/quasar-cli/developing-electron-apps/node-integration
      nodeIntegration,
      nodeIntegrationInWorker: nodeIntegration,
      contextIsolation: true,
      sandbox: false,

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: path.resolve(
        currentDir,
        path.join(
          process.env.QUASAR_ELECTRON_PRELOAD_FOLDER ?? '',
          'electron-preload' + process.env.QUASAR_ELECTRON_PRELOAD_EXTENSION,
        ),
      ),
    },
  })

  mainWindow.setMenu(menu)

  const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
  blocker.enableBlockingInSession(session.defaultSession)

  await session.defaultSession.cookies.set({
    url: 'https://www.webtoons.com/',
    name: 'pagGDPR',
    value: 'true',
  })

  await session.defaultSession.cookies.set({
    url: 'https://www.webtoons.com/',
    name: 'timezoneOffset',
    value: (moment().utcOffset() / 60).toString(),
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    onNavigation(event, url)
  })

  mainWindow.webContents.on('will-redirect', (event, url) => {
    onNavigation(event, url)
  })

  await loadAppUrl()

  mainWindow.on('closed', () => {
    mainWindow = undefined
  })
}

async function loadAppUrl(): Promise<void> {
  if (process.env.DEV) {
    if (!process.env.APP_URL) throw new Error('No app url')
    await mainWindow?.loadURL(process.env.APP_URL)
  } else {
    await mainWindow?.loadFile('index.html')
  }
}

function onNavigation(event: Event, url: string): void {
  if (!url.startsWith('http://localhost/redirect?')) return
  handleDropboxOAuth(event, url)
}

function handleDropboxOAuth(event: Event, url: string): void {
  event.preventDefault()
  queryString = qs.parse(url.replace('http://localhost/redirect?', ''))
  oauthType = 'dropbox'

  loadAppUrl().catch(console.error)
  mainWindow?.webContents.on('did-finish-load', onFinishLoad)
}

function onFinishLoad(): void {
  if (!queryString || !oauthType) return

  mainWindow?.webContents.send(`${oauthType}-token`, queryString)
  mainWindow?.webContents.removeListener('did-finish-load', onFinishLoad)
}

app.setAppUserModelId('Manga Reader')

app.whenReady().then(createWindow).catch(console.error)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (!mainWindow) {
    createWindow().catch(console.error)
  }
})

let cookieNames: string[] = []

ipcMain.handle('cookie-names', (_event, newCookieNames: string[]) => {
  cookieNames = newCookieNames
})

ipcMain.handle('net-request', async (_event, options: HttpRequest): Promise<HttpResponse> => {
  await app.whenReady()
  const headers = options.headers ?? {}

  const domain = new URL(options.url).hostname
  const cookies = await session.defaultSession.cookies.get({ domain })
  cookies
    .filter((cookie) => cookieNames.includes(cookie.name))
    .forEach((cookie) => {
      if (cookie === undefined || cookie === null) return
      if (!headers.cookie) {
        headers.cookie = `${cookie.name}=${cookie.value}`
        return
      }

      headers.cookie += `;${cookie.name}=${cookie.value}`
    })

  const request = net.request({
    method: options.method,
    url: options.url,
  })

  return new Promise((resolve, reject) => {
    let answered = false

    request.on('response', (response) => {
      let data = new Uint8Array()

      response.on('data', (chunk) => {
        const mergedData = new Uint8Array(data.length + chunk.length)
        mergedData.set(data)
        mergedData.set(chunk, data.length)

        data = mergedData
      })

      response.on('end', () => {
        if (answered) return

        const resultData =
          headers.responseType === 'arraybuffer' ? Buffer.from(data).toString('base64') : Buffer.from(data).toString()

        const result: HttpResponse = {
          headers: response.headers,
          data: resultData,
          status: response.statusCode,
          statusText: response.statusMessage,
        }

        answered = true
        resolve(result)
      })
    })

    request.on('error', (error) => {
      if (answered) return
      answered = true
      reject(error)
    })

    Object.entries(headers).forEach(([key, value]) => {
      request.setHeader(key, value)
    })

    if (options.data) {
      request.write(options.data)
    }

    request.end()
  })
})
