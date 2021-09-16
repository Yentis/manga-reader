import HttpRequest from './httpRequest'
import HttpResponse from './httpResponse'

export default interface ElectronWindow {
  mangaReader: {
    onDropboxToken: (event: unknown, token?: string) => void,
    openURL: (url: string) => void,
    sendRequest: (options: HttpRequest) => Promise<HttpResponse>
  }
}
