import HttpRequest from 'src/interfaces/httpRequest'
import HttpResponse from 'src/interfaces/httpResponse'

export default abstract class BaseRequest {
  abstract sendRequest(request: HttpRequest): Promise<HttpResponse>

  protected convertToUrlEncoded (data?: string): string {
    const parsedData = JSON.parse(data || '{}') as Record<string, string>

    return Object.entries(parsedData)
      .map(([key, value]) => {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      })
      .join('&')
  }
}
