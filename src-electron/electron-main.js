import { app, BrowserWindow, nativeTheme, session, Menu } from 'electron'
import { ElectronBlocker } from '@cliqz/adblocker-electron'
import qs from 'qs'
import fetch from 'isomorphic-fetch'
import moment from 'moment'
import path from 'path'

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(require('path').join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = __dirname
}

let mainWindow
let queryString
let oauthType

app.userAgentFallback = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) old-airport-include/1.0.0 Chrome Electron/7.1.7 Safari/537.36'

function createWindow () {
  const menu = Menu.buildFromTemplate([{
    label: '<',
    click: (_item, window) => {
      window.webContents.goBack()
    }
  }, {
    label: '>',
    click: (_item, window) => {
      window.webContents.goForward()
    }
  }, {
    label: 'Manga list',
    click: (_item, window) => {
      window.webContents.goToIndex(0)
    }
  }, {
    label: '',
    role: "toggleDevTools",
    visible: false
  }])

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
      nodeIntegration: process.env.QUASAR_NODE_INTEGRATION,
      nodeIntegrationInWorker: process.env.QUASAR_NODE_INTEGRATION,
      contextIsolation: true,

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
    }
  })

  mainWindow.setMenu(menu)

  ElectronBlocker.fromPrebuiltAdsAndTracking(fetch).then(blocker => {
    blocker.enableBlockingInSession(session.defaultSession)
  })

  session.defaultSession.cookies.set({
    url: 'https://www.webtoons.com/',
    name: 'ageGatePass',
    value: 'true'
  })
  
  session.defaultSession.cookies.set({
    url: 'https://www.webtoons.com/',
    name: 'timezoneOffset',
    value: (moment().utcOffset() / 60).toString()
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    onNavigation(event, url)
  })
  
  mainWindow.webContents.on('will-redirect', (event, url) => {
    onNavigation(event, url)
  })

  mainWindow.loadURL(process.env.APP_URL).catch(error => console.error(error))

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function onNavigation(event, url) {
  if (url.startsWith('http://localhost/redirect_gitlab')) {
    handleGitlabOAuth(event, url)
    return
  }

  if (!url.startsWith('http://localhost/redirect#')) return
  handleDropboxOAuth(event, url)
}

function handleGitlabOAuth(event, url) {
  event.preventDefault()
  queryString = qs.parse(url.replace('http://localhost/redirect_gitlab#', ''))
  oauthType = 'gitlab'

  mainWindow.loadURL(process.env.APP_URL).catch(error => console.error(error))
  mainWindow.webContents.on('did-finish-load', onFinishLoad)
}

function handleDropboxOAuth(event, url) {
  event.preventDefault()
  queryString = qs.parse(url.replace('http://localhost/redirect#', ''))
  oauthType = 'dropbox'

  mainWindow.loadURL(process.env.APP_URL).catch(error => console.error(error))
  mainWindow.webContents.on('did-finish-load', onFinishLoad)
}

function onFinishLoad() {
  if (!queryString) return

  mainWindow.webContents.send(`${oauthType}-token`, queryString.access_token)
  mainWindow.webContents.removeListener('did-finish-load', onFinishLoad)
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
