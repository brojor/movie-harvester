import type { MediaMetaWithSource, MediaType, MovieMetaWithSource, ParseTopicResult, TopicType, TvShowMetaWithSource } from '../types/domain.js'
import process from 'node:process'
import * as cheerio from 'cheerio'
import { isOld, parseDate } from '../utils/date.js'
import { extractTopicRows, parseTopicId, parseTopicTitle } from '../utils/htmlParsing.js'
import { parseMediaItem } from '../utils/parsing.js'

export function parseTopicPage<T extends MediaType>(
  html: string,
  topicType: TopicType,
  mediaType: T,
  cutoffDate: Date,
): ParseTopicResult<MediaMetaWithSource<T>> {
  const $ = cheerio.load(html)
  const mediaItems: (MovieMetaWithSource | TvShowMetaWithSource)[] = []
  let lastRowDate: Date = new Date()

  const rows = extractTopicRows($)

  if (rows.length === 0) {
    console.error('No rows found, is SID valid?')
    process.exit(1)
  }

  rows.each((_, row) => {
    const dateString = $(row)
      .find('td:nth-child(5) .gensmall')
      .contents()
      .filter(function () {
        return this.type === 'text'
      })
      .text()

    const date = parseDate(dateString)
    if (!date)
      return

    lastRowDate = date

    if (isOld(date, cutoffDate))
      return

    const title = parseTopicTitle(row, $)
    const sourceTopic = parseTopicId(row, $)

    if (!title || !sourceTopic) {
      console.error('Missing title or sourceTopic, skipping row')
      return
    }

    const parsedItem = parseMediaItem(title, sourceTopic, mediaType, topicType)
    if (parsedItem) {
      mediaItems.push(parsedItem)
    }
  })

  const reachedCutoff = isOld(lastRowDate, cutoffDate)

  return {
    mediaItems: mediaItems as MediaMetaWithSource<T>[],
    reachedCutoff,
  }
}
