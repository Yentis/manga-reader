import moment from 'moment'
import { BaseData } from 'src/classes/sites/baseSite'
import HttpRequest from 'src/interfaces/httpRequest'
import { requestHandler } from 'src/services/requestService'
import { parseHtmlFromString } from 'src/utils/siteUtils'

export async function getRssData (url: string, request: HttpRequest): Promise<BaseData> {
  const response = await requestHandler.sendRequest(request)
  const doc = await parseHtmlFromString(response.data, undefined, 'text/xml')

  const data = new BaseData(url)
  const channel = doc.querySelectorAll('channel')[0]

  data.image = channel?.querySelectorAll('image url')[0]
  data.title = channel?.querySelectorAll('title')[0]

  const chapter = channel?.querySelectorAll('item')[0]
  data.chapter = chapter
  data.chapterNum = chapter?.querySelectorAll('title')[0]
  data.chapterDate = chapter?.querySelectorAll('pubDate')[0]

  return data
}

function removeCdata (content: string): string {
  return content.replace('<![CDATA[', '').replace(']]>', '').trim()
}

export function getRssChapter (data: BaseData): string {
  const chapterTitle = data.chapter?.querySelectorAll('title')[0]
  const chapterText = chapterTitle?.textContent
  if (!chapterText) return 'Unknown'

  return removeCdata(chapterText)
}

export function getRssChapterUrl (data: BaseData): string {
  const chapterLink = data.chapter?.querySelectorAll('link')[0]
  return chapterLink?.textContent || ''
}

export function getRssChapterDate (data: BaseData): string {
  const chapterDateText = data.chapterDate?.textContent?.trim()
  if (!chapterDateText) return ''

  const chapterDate = moment(chapterDateText, 'dddd, DD MMM YYYY HH:mm:ss')
  if (chapterDate.isValid()) {
    return chapterDate.fromNow()
  } else {
    return ''
  }
}

export function getRssImage (data: BaseData): string {
  return data.image?.textContent || ''
}

export function getRssTitle (data: BaseData): string {
  const titleText = data.title?.textContent
  if (!titleText) return ''

  return removeCdata(titleText)
}
