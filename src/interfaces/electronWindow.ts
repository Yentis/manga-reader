import type { HttpRequest } from './httpRequest'
import type HttpResponse from './httpResponse'
import type qs from 'qs'
import type { IpcRendererEvent } from 'electron'

export default interface ElectronWindow {
  mangaReader: {
    onDropboxToken: (callback: (event: IpcRendererEvent, queryString?: qs.ParsedQs) => void) => void
    openURL: (url: string) => void
    sendRequest: (options: HttpRequest) => Promise<HttpResponse>
    setCookieNames: (cookieNames: string[]) => Promise<void>
  }
}
