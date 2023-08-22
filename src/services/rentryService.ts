import { LocalStorage } from 'quasar'
import constants from 'src/classes/constants'
import { requestHandler } from './requestService'
import { Ref } from '@vue/runtime-core/dist/runtime-core'
import { UrlNavigation } from '../classes/urlNavigation'
import { NotifyOptions } from 'src/classes/notifyOptions'
import { ContentType } from 'src/enums/contentTypeEnum'
import { getCookies } from 'src/classes/requests/baseRequest'
import { Data64URIWriter, TextReader, ZipWriter } from '@zip.js/zip.js'

const URL = 'https://rentry.co'

interface RentryResponse {
  status: string
  content: string
  url: string
  // eslint-disable-next-line camelcase
  edit_code: string
}

export function getShareId(): string {
  const shareId = LocalStorage.getItem(constants.SHARE_ID)
  if (typeof shareId !== 'string') return ''

  return shareId
}

export function setShareId(id?: string) {
  if (id === undefined) return
  LocalStorage.set(constants.SHARE_ID, id)
}

export function getEditCode(): string {
  const shareEditCode = LocalStorage.getItem(constants.SHARE_EDIT_CODE)
  if (typeof shareEditCode !== 'string') return ''

  return shareEditCode
}

export function setEditCode(code?: string) {
  if (code === undefined) return
  LocalStorage.set(constants.SHARE_EDIT_CODE, code)
}

export async function getCsrfToken(): Promise<string> {
  const response = await requestHandler.sendRequest({
    method: 'GET',
    url: URL,
  })

  const cookies = getCookies(response)
  if (cookies.csrftoken === undefined) {
    throw Error('CSRF token was not found')
  }

  return cookies.csrftoken
}

async function zipData(data: string): Promise<string> {
  const zipFileWriter = new Data64URIWriter()
  const listReader = new TextReader(data)
  const zipWriter = new ZipWriter(zipFileWriter)

  await zipWriter.add('list.txt', listReader)
  await zipWriter.close()

  return zipFileWriter.getData()
}

export async function createList(list: string, url?: string): Promise<string> {
  const shareId = getShareId()
  const editCode = getEditCode()
  if (shareId && editCode) {
    return Promise.resolve(shareId)
  }

  const csrfToken = await getCsrfToken()
  const zippedList = await zipData(list)

  const response = await requestHandler.sendRequest({
    method: 'POST',
    data: JSON.stringify({
      csrfmiddlewaretoken: csrfToken,
      text: zippedList,
      url,
    }),
    url: `${URL}/api/new`,
    headers: {
      Referer: URL,
      'Content-Type': ContentType.URLENCODED,
      cookie: `csrftoken=${csrfToken}`,
    },
  })

  const data = JSON.parse(response.data) as RentryResponse
  if (data.status !== '200') {
    throw Error(`Response status: ${data.status} with message: ${data.content}`)
  }

  const split = data.url.split('/')
  const id = split[split.length - 1]
  if (id === undefined) {
    throw Error(`Could not parse response url: ${data.url}`)
  }

  setShareId(id)
  setEditCode(data.edit_code)

  return id
}

export async function updateList(list: string): Promise<void> {
  const shareId = getShareId()
  if (!shareId) return Promise.resolve()

  const editCode = getEditCode()
  if (!editCode) {
    await createList(list, shareId)
    return
  }

  const csrfToken = await getCsrfToken()
  const zippedList = await zipData(list)

  const response = await requestHandler.sendRequest({
    method: 'POST',
    data: JSON.stringify({
      csrfmiddlewaretoken: csrfToken,
      text: zippedList,
      edit_code: editCode,
    }),
    url: `${URL}/api/edit/${shareId}`,
    headers: {
      Referer: URL,
      'Content-Type': ContentType.URLENCODED,
      cookie: `csrftoken=${csrfToken}`,
    },
  })

  const responseData = JSON.parse(response.data) as { status?: string; errors?: string }
  if (responseData.errors) throw new Error(`Status: ${responseData.status ?? 'unknown'}, ${responseData.errors}`)
}

export function getNotifyOptions(error: unknown, urlNavigation: Ref<UrlNavigation | undefined>) {
  let description = JSON.stringify(error)
  if (error instanceof Error) {
    description = error.message
  }

  const notifyOptions = new NotifyOptions(description, 'Failed to set share URL')
  notifyOptions.actions = [
    {
      label: 'Visit',
      handler: () => {
        urlNavigation.value = new UrlNavigation(URL, false)
      },
      color: 'white',
    },
  ]
  return notifyOptions
}
