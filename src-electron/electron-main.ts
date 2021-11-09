import { app, BrowserWindow, nativeTheme, session, Menu, ipcMain, net, Event } from 'electron'
import { ElectronBlocker } from '@cliqz/adblocker-electron'
import qs from 'qs'
import fetch from 'isomorphic-fetch'
import moment from 'moment'
import path from 'path'
import fs from 'fs'
import HttpRequest from 'src/interfaces/httpRequest'
import HttpResponse from 'src/interfaces/httpResponse'

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    fs.unlinkSync(path.join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  global.__statics = __dirname
}

let mainWindow: BrowserWindow | undefined
let queryString: qs.ParsedQs | undefined
let oauthType: string | undefined

app.userAgentFallback = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) old-airport-include/1.0.0 Chrome Electron/7.1.7 Safari/537.36'

function createWindow () {
  const menu = Menu.buildFromTemplate([{
    label: '<',
    click: (_item, window) => {
      window?.webContents.goBack()
    }
  }, {
    label: '>',
    click: (_item, window) => {
      window?.webContents.goForward()
    }
  }, {
    label: 'Manga list',
    click: (_item, window) => {
      window?.webContents.goToIndex(0)
    }
  }, {
    label: '',
    role: 'toggleDevTools',
    visible: false
  }])

  const nodeIntegration = process.env.QUASAR_NODE_INTEGRATION === 'true'
  const preloadFile = process.env.QUASAR_ELECTRON_PRELOAD
  const preload = preloadFile ? path.resolve(__dirname, preloadFile) : undefined

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

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload
    }
  })

  mainWindow.setMenu(menu)

  ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then(blocker => {
    blocker.enableBlockingInSession(session.defaultSession)
  }).catch((error) => console.error(error))

  session.defaultSession.cookies.set({
    url: 'https://www.webtoons.com/',
    name: 'pagGDPR',
    value: 'true'
  }).catch((error) => console.error(error))

  session.defaultSession.cookies.set({
    url: 'https://www.webtoons.com/',
    name: 'timezoneOffset',
    value: (moment().utcOffset() / 60).toString()
  }).catch((error) => console.error(error))

  mainWindow.webContents.on('will-navigate', (event, url) => {
    onNavigation(event, url)
  })

  mainWindow.webContents.on('will-redirect', (event, url) => {
    onNavigation(event, url)
  })

  loadAppUrl()

  mainWindow.on('closed', () => {
    mainWindow = undefined
  })
}

function loadAppUrl () {
  if (!process.env.APP_URL) {
    console.error(Error('APP_URL environment variable not found!'))
    return
  }
  mainWindow?.loadURL(process.env.APP_URL).catch(error => console.error(error))
}

function onNavigation (event: Event, url: string) {
  if (!url.startsWith('http://localhost/redirect#')) return
  handleDropboxOAuth(event, url)
}

function handleDropboxOAuth (event: Event, url: string) {
  event.preventDefault()
  queryString = qs.parse(url.replace('http://localhost/redirect#', ''))
  oauthType = 'dropbox'

  loadAppUrl()
  mainWindow?.webContents.on('did-finish-load', onFinishLoad)
}

function onFinishLoad () {
  if (!queryString || !oauthType) return

  mainWindow?.webContents.send(`${oauthType}-token`, queryString.access_token)
  mainWindow?.webContents.removeListener('did-finish-load', onFinishLoad)
}

app.setAppUserModelId('Manga Reader')

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

const COOKIE_NAMES = ['cf_clearance', '__ddg1', '__ddg2', '__ddgid', '__ddgmark']

ipcMain.handle('net-request', async (
  _event,
  options: HttpRequest
): Promise<HttpResponse> => {
  await app.whenReady()
  const headers = options.headers || {}

  const cookies = await session.defaultSession.cookies.get({ url: options.url })
  cookies.filter((cookie) => COOKIE_NAMES.includes(cookie.name)).forEach((cookie) => {
    if (!cookie) return
    if (!headers.cookie) {
      headers.cookie = `${cookie.name}=${cookie.value}`
      return
    }

    headers.cookie += `;${cookie.name}=${cookie.value}`
  })

  const request = net.request({
    method: options.method,
    url: options.url
  })

  return new Promise((resolve, reject) => {
    let answered = false

    request.on('response', (response) => {
      let data = ''

      response.on('data', (chunk) => {
        data += chunk.toString()
      })

      response.on('end', () => {
        if (answered) return

        const result: HttpResponse = {
          headers: response.headers,
          data,
          status: response.statusCode,
          statusText: response.statusMessage
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
