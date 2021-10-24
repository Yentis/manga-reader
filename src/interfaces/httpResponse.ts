export default interface HttpResponse {
  headers: Record<string, string | string[]>
  data: string
  status: number
  statusText: string
}
