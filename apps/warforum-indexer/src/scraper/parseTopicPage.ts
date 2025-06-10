import type { Cheerio, CheerioAPI } from 'cheerio'
import type { Element as DomElement } from 'domhandler'
import type { MovieMetaWithSource, ParseMovieTopicResult, ParseTvShowTopicResult, TopicType, TvShowMetaWithSource } from '../types/domain.js'
import * as cheerio from 'cheerio'
import { isOld, parseDate } from '../utils/date.js'
import { extractTopicId, parseMovieCoreMeta, parseTvShowCoreMeta } from '../utils/parsing.js'

export function parseTopicPage(html: string, topicType: TopicType, mediaType: 'movie', cutoffDate: Date): ParseMovieTopicResult
export function parseTopicPage(html: string, topicType: TopicType, mediaType: 'tvShow', cutoffDate: Date): ParseTvShowTopicResult
export function parseTopicPage(html: string, topicType: TopicType, mediaType: 'movie' | 'tvShow', cutoffDate: Date): ParseMovieTopicResult | ParseTvShowTopicResult {
  const $ = cheerio.load(html)

  const movieItems: MovieMetaWithSource[] = []
  const tvShowItems: TvShowMetaWithSource[] = []
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

    if (mediaType === 'movie') {
      const isDubbed = topicType.endsWith('Dub')

      const coreMeta = isDubbed ? parseMovieCoreMeta(title, true) : parseMovieCoreMeta(title, false)
      if (!coreMeta)
        return

      movieItems.push({
        coreMeta,
        sourceTopic,
      })
    }
    else {
      const coreMeta = parseTvShowCoreMeta(title)
      if (!coreMeta)
        return

      tvShowItems.push({
        coreMeta,
        sourceTopic,
      })
    }
  })

  const reachedCutoff = isOld(lastRowDate, cutoffDate)

  if (mediaType === 'movie') {
    return {
      mediaItems: movieItems,
      reachedCutoff,
    } satisfies ParseMovieTopicResult
  }

  return {
    mediaItems: tvShowItems,
    reachedCutoff,
  } satisfies ParseTvShowTopicResult
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
