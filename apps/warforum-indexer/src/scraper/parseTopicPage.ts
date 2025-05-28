import type { Cheerio, CheerioAPI } from 'cheerio'
import type { Element as DomElement } from 'domhandler'
import type { MovieWithTopicId, ParseResult, TopicKey } from '../types/domain.js'
import * as cheerio from 'cheerio'
import { isOld, parseDate } from '../utils/date.js'
import { extractTopicId, parseTopicName } from '../utils/parsing.js'

export function parseTopicPage(html: string, topicType: TopicKey): ParseResult {
  const $ = cheerio.load(html)

  const movies: MovieWithTopicId[] = []
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

    if (isOld(date))
      return

    const movie = parseMovieRow(row, topicType, $)
    if (movie)
      movies.push(movie)
  })

  const nextPage = !isOld(lastRowDate)
    ? $('a:contains("Další")').first().attr('href') ?? null
    : null

  return { movies, nextPage }
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

function parseMovieRow(
  row: DomElement,
  topicType: TopicKey,
  $: CheerioAPI,
): MovieWithTopicId | null {
  const title = $(row).find('a.topictitle').text().trim()
  const href = $(row).find('a.topictitle').attr('href')
  if (!href)
    return null

  const topicNumber = extractTopicId(href)
  const movieInfo = parseTopicName(title, topicType)
  if (!movieInfo)
    return null

  return {
    ...movieInfo,
    topicNumber,
  }
}
