import type { Cheerio, CheerioAPI } from 'cheerio'
import type { Element as DomElement } from 'domhandler'

import { Buffer } from 'node:buffer'
import { db, schema } from '@repo/database'
import { getThrottledClient } from '@repo/shared'
import * as cheerio from 'cheerio'
import { isBefore, parse, sub } from 'date-fns'
import { cs } from 'date-fns/locale'
import iconv from 'iconv-lite'

/**
 * === Domain types ===
 */

enum TopicKey {
  Hd = 'hd',
  HdDub = 'hdDub',
  Uhd = 'uhd',
  UhdDub = 'uhdDub',
}

interface TopicMeta {
  id: number
  isDub: boolean
}

const TOPIC_META: Record<TopicKey, TopicMeta> = {
  [TopicKey.Hd]: { id: 322, isDub: false },
  [TopicKey.HdDub]: { id: 323, isDub: true },
  [TopicKey.Uhd]: { id: 374, isDub: false },
  [TopicKey.UhdDub]: { id: 373, isDub: true },
} as const

interface Movie {
  czechTitle: string
  originalTitle: string
  year: number
}

interface MovieWithTopicId extends Movie {
  topicNumber: number
}

interface ParseResult {
  movies: MovieWithTopicId[]
  nextPage: string | null
}

/* ==========================================================================
 * Infrastructure
 * ========================================================================= */

const ENV = {
  baseUrl: 'http://www.warforum.xyz',
  sid: 'b7067a87df1c392366aaba56485d093f',
} as const

const httpClient = getThrottledClient(ENV.baseUrl, {
  cookie: `warforum_sid=${ENV.sid}`,
  responseType: 'arraybuffer',
  delayMs: [1000, 1500],
})

async function fetchHtml(relativeUrl: string): Promise<string> {
  const data = await httpClient.get(relativeUrl)
  return iconv.decode(Buffer.from(data), 'windows-1250')
}

/**
 * === Entry point ===
 */

async function main(): Promise<void> {
  for (const topicType of Object.values(TopicKey)) {
    const { id: topicId } = TOPIC_META[topicType]
    const movies = await fetchAllMovies(`viewforum.php?f=${topicId}`, topicType)

    for (const movie of movies) {
      await upsertMovie(movie, topicType)
    }
  }
}

main().catch(err => console.error('Fatal scraper error', err))

/**
 * === Scraper pipeline ===
 */

async function fetchAllMovies(
  url: string,
  topicType: TopicKey,
  acc: MovieWithTopicId[] = [],
): Promise<MovieWithTopicId[]> {
  try {
    const html = await fetchHtml(url)
    const { movies, nextPage } = parseTopicPage(html, topicType)

    const collected = [...acc, ...movies]

    if (nextPage) {
      return fetchAllMovies(nextPage, topicType, collected)
    }

    return collected
  }
  catch (error) {
    console.error('Chyba při načítání filmů:', error)
    return acc
  }
}

/* ==========================================================================
 * HTML parsing helpers
 * ========================================================================= */

function parseTopicPage(html: string, topicType: TopicKey): ParseResult {
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

/**
 * === Helpers ===
 */

function extractTopicId(url: string): number {
  const match = url.match(/t=(\d+)/)
  if (!match) {
    throw new Error('Invalid topic URL')
  }
  return Number.parseInt(match[1], 10)
}

function parseTopicName(title: string, topicType: TopicKey): Movie | null {
  const regex = /^(?:(.*?) \/ )?(.*?) \((\d{4})\)$/
  const match = title.match(regex)

  if (!match) {
    return null
  }

  const [, first, second, yearStr] = match
  const year = Number.parseInt(yearStr, 10)

  const isDub = TOPIC_META[topicType].isDub

  return {
    czechTitle: isDub ? (first || second).trim() : second.trim(),
    originalTitle: isDub ? second.trim() : (first || second).trim(),
    year,
  }
}

function parseDate(raw: string): Date {
  return parse(raw.trim(), 'dd MMMM yyyy, HH:mm', new Date(), { locale: cs })
}

function isOld(date: Date): boolean {
  return isBefore(date, sub(new Date(), { months: 6 }))
}

/**
 * === Persistence layer ===
 */

async function upsertMovie(
  movie: MovieWithTopicId,
  topicType: TopicKey,
): Promise<void> {
  const isDub = TOPIC_META[topicType].isDub
  try {
    await db
      .insert(schema.moviesSource)
      .values({ ...movie, [topicType]: movie.topicNumber })
      .onConflictDoUpdate({
        target: isDub
          ? [schema.moviesSource.czechTitle, schema.moviesSource.year]
          : [schema.moviesSource.originalTitle, schema.moviesSource.year],
        set: {
          [topicType]: movie.topicNumber,
          updatedAt: new Date(),
        },
      })
  }
  catch (err) {
    console.error(
      `Error upserting movie \"${movie.czechTitle}\" / \"${movie.originalTitle}\" (${movie.year})`,
      err,
    )
  }
}
