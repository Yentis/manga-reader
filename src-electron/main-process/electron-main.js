import { app, BrowserWindow, nativeTheme, session, Menu } from 'electron'
import qs from 'qs'

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
      nodeIntegrationInWorker: process.env.QUASAR_NODE_INTEGRATION

      // More info: /quasar-cli/developing-electron-apps/electron-preload-script
      // preload: path.resolve(__dirname, 'electron-preload.js')
    }
  })

  mainWindow.setMenu(menu)
  session.defaultSession.cookies.set({
    url: 'https://www.webtoons.com/',
    name: 'ageGatePass',
    value: 'true'
  })

  session.defaultSession.webRequest.onBeforeRequest({
    urls: ['http://localhost/redirect*']
  }, (details, callback) => {
    const queryString = qs.parse(details.url.replace('http://localhost/redirect#', ''))

    callback({
      redirectURL: process.env.APP_URL + `/#/redirect/${queryString.access_token}`
    })
  })

  mainWindow.loadURL(process.env.APP_URL).catch(error => console.error(error))

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

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
