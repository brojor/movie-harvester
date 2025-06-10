import type { Cheerio, CheerioAPI } from 'cheerio'
import type { Element as DomElement } from 'domhandler'
import type { MediaMetaWithSource, MediaType, MovieMetaWithSource, ParseTopicResult, TopicType, TvShowMetaWithSource } from '../types/domain.js'
import * as cheerio from 'cheerio'
import { isOld, parseDate } from '../utils/date.js'
import { extractTopicId, parseMediaItem } from '../utils/parsing.js'

export function parseTopicPage<T extends MediaType>(
  html: string,
  topicType: TopicType,
  mediaType: T,
  cutoffDate: Date,
): ParseTopicResult<MediaMetaWithSource<T>> {
  const $ = cheerio.load(html)
  const mediaItems: (MovieMetaWithSource | TvShowMetaWithSource)[] = []
  let lastRowDate: Date = new Date()

  const rows = extractMovieRows($)

  if (rows.length === 0) {
    throw new Error('No rows found, is SID valid?')
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
    lastRowDate = date

    if (isOld(date, cutoffDate))
      return

    const title = parseMediaTitle(row, $)
    const sourceTopic = parseSourceTopicId(row, $)

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

function parseMediaTitle(row: DomElement, $: CheerioAPI): string {
  const title = $(row).find('a.topictitle').text().trim()
  if (!title)
    throw new Error(`Missing title in: "${row}"`)

  return title
}

function parseSourceTopicId(row: DomElement, $: CheerioAPI): number {
  const href = $(row).find('a.topictitle').attr('href')
  if (!href)
    throw new Error(`Missing href in: "${row}"`)

  return extractTopicId(href)
}
