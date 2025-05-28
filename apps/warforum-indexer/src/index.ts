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

/**
 * === Infrastructure ===
 */

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
  allMovies: MovieWithTopicId[] = [],
): Promise<MovieWithTopicId[]> {
  try {
    const html = await fetchHtml(url)
    const { movies, nextPage } = parseTopicNames(html, topicType)

    const updatedMovies = [...allMovies, ...movies]

    if (nextPage) {
      return fetchAllMovies(nextPage, topicType, updatedMovies)
    }

    return updatedMovies
  }
  catch (error) {
    console.error('Chyba při načítání filmů:', error)
    return allMovies
  }
}

function parseTopicNames(
  htmlContent: string,
  topicType: TopicKey,
): { movies: MovieWithTopicId[], nextPage: string | null } {
  const $ = cheerio.load(htmlContent)
  const movies: MovieWithTopicId[] = []
  let lastMovieDate: Date = new Date()

  const elements = $('table.forumline:nth-child(1) tr').filter((_, element) => {
    // filter out header and footer rows
    if ($(element).children('td').length !== 5) {
      return false
    }

    // filter out pinned topics
    if ($(element).children().eq(1).children().eq(0).text().trim() === 'Důležité:') {
      return false
    }

    return true
  })

  const nextPage = $('a:contains("Další")').first().attr('href')!

  elements.each((_, element) => {
    const title = $(element).find('a.topictitle').text().trim()
    const url = $(element).find('a.topictitle').attr('href')!
    const topicNumber = extractTopicId(url)
    const movie = parseTopicName(title, topicType)

    const dateString = $(element)
      .find('td:nth-child(5) .gensmall')
      .contents()
      .filter(function () {
        return this.type === 'text'
      })
      .text()

    const date = parseDate(dateString)

    if (!isOld(date) && movie) {
      movies.push({
        ...movie,
        topicNumber,
      })
    }

    lastMovieDate = date
  })

  return { movies, nextPage: !isOld(lastMovieDate) ? nextPage : null }
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

function parseDate(str: string): Date {
  const dateString = str.trim()
  return parse(dateString, 'dd MMMM yyyy, HH:mm', new Date(), { locale: cs })
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
