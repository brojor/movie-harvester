import type { MovieTopicType, TopicType, TvShowTopicType } from '@repo/shared'
import type { MediaType, MovieTopic, ParseTopicResult, TvShowTopic } from '@repo/types'
import process from 'node:process'
import * as cheerio from 'cheerio'
import { isOld, parseDate } from '../utils/date.js'
import { extractTopicRows, parseTopicId, parseTopicTitle as parseTopicTitleText } from '../utils/htmlParsing.js'
import { parseMovieCoreMeta, parseTvShowCoreMeta } from '../utils/parsing.js'

export function parseTopicPage<T extends MediaType>(
  html: string,
  topicType: TopicType,
  mediaType: T,
  cutoffDate: Date,
): ParseTopicResult<MovieTopic | TvShowTopic> {
  const $ = cheerio.load(html)
  const mediaItems: (MovieTopic | TvShowTopic)[] = []
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

    const topicTitleText = parseTopicTitleText(row, $)
    const topicId = parseTopicId(row, $)

    if (!topicTitleText || !topicId) {
      console.error('Missing title or sourceTopic, skipping row')
      return
    }

    if (mediaType === 'movie') {
      const movieCoreMeta = parseMovieCoreMeta(topicTitleText)
      if (movieCoreMeta) {
        mediaItems.push({ ...movieCoreMeta, id: topicId, type: topicType as MovieTopicType })
      }
    }
    else {
      const tvShowCoreMeta = parseTvShowCoreMeta(topicTitleText)
      if (tvShowCoreMeta) {
        mediaItems.push({ ...tvShowCoreMeta, id: topicId, type: topicType as TvShowTopicType })
      }
    }
  })

  const reachedCutoff = isOld(lastRowDate, cutoffDate)

  return {
    mediaItems,
    reachedCutoff,
  }
}
