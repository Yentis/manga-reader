import HttpRequest from './httpRequest'
import HttpResponse from './httpResponse'
import qs from 'qs'

export default interface ElectronWindow {
  mangaReader: {
    onDropboxToken: (event: unknown, queryString?: qs.ParsedQs) => void,
    openURL: (url: string) => void,
    sendRequest: (options: HttpRequest) => Promise<HttpResponse>
  }
}
