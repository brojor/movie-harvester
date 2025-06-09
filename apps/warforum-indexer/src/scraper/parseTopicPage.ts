import type { Cheerio, CheerioAPI } from 'cheerio'
import type { Element as DomElement } from 'domhandler'
import type { CoreMetaWithSourceTopic, ParseTopicResult, TopicType } from '../types/domain.js'
import * as cheerio from 'cheerio'
import { isOld, parseDate } from '../utils/date.js'
import { extractTopicId, parseMovieCoreMeta } from '../utils/parsing.js'

export function parseTopicPage(html: string, topicType: TopicType, cutoffDate: Date): ParseTopicResult {
  const $ = cheerio.load(html)

  const mediaItems: CoreMetaWithSourceTopic[] = []
  let lastRowDate: Date = new Date()

  const rows = extractMovieRows($)

  rows.each((_, row) => {
    const dateString = $(row)
      .find('td:nth-child(5) .gensmall')
      .contents()
      .filter(function () {
        return this.type === 'text'
      })
      .text()

    const date = parseDate(dateString)
    lastRowDate = date

    if (isOld(date, cutoffDate))
      return

    const coreMetaWithSourceTopic = parseCoreMetaWithSourceTopic(row, topicType, $)
    if (coreMetaWithSourceTopic)
      mediaItems.push(coreMetaWithSourceTopic)
  })

  const reachedCutoff = isOld(lastRowDate, cutoffDate)

  return { mediaItems, reachedCutoff }
}

function extractMovieRows($: CheerioAPI): Cheerio<DomElement> {
  const rows = $('table.forumline:nth-child(1) tr').filter((_, row) => {
    const cells = $(row).children('td')

    if (cells.length !== 5)
      return false // header/footer

    const maybePinned = cells.eq(1).children().eq(0).text().trim()
    return maybePinned !== 'Důležité:' // skip pinned topics
  })

  return rows
}

function parseCoreMetaWithSourceTopic(
  row: DomElement,
  topicType: TopicType,
  $: CheerioAPI,
): CoreMetaWithSourceTopic | null {
  const title = $(row).find('a.topictitle').text().trim()
  const href = $(row).find('a.topictitle').attr('href')
  if (!href)
    throw new Error(`Missing href in: "${title}"`)

  const sourceTopic = extractTopicId(href)
  const dubbedTypes: TopicType[] = ['hdDub', 'uhdDub']
  const isDubbed = dubbedTypes.includes(topicType)

  const coreMeta = isDubbed ? parseMovieCoreMeta(title, true) : parseMovieCoreMeta(title, false)
  if (!coreMeta)
    return null

  return {
    coreMeta,
    sourceTopic,
  }
}
