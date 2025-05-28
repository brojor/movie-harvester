import { Buffer } from 'node:buffer'
import { db, schema } from '@repo/database'
import * as cheerio from 'cheerio'
import { isBefore, parse, sub } from 'date-fns'
import { cs } from 'date-fns/locale'
import iconv from 'iconv-lite'

type TopicType = keyof typeof topicMap
interface MovieInfo {
  czechTitle: string
  originalTitle: string
  year: number
}

interface MovieWithTopic extends MovieInfo {
  topicNumber: number
}

const BASE_URL = 'http://www.warforum.xyz'
const SID = 'b7067a87df1c392366aaba56485d093f'

const topicMap = {
  hd: 322,
  hdDub: 323,
  uhd: 374,
  uhdDub: 373,
} as const

async function main(): Promise<void> {
  for (const [topicType, topicId] of Object.entries(topicMap) as [TopicType, number][]) {
    const movies = await fetchAllMovies(`viewforum.php?f=${topicId}`, topicType)
    for (const movie of movies) {
      await upsertMovie(movie, topicType)
    }
  }
}

main()

async function fetchAllMovies(url: string, topicType: TopicType, allMovies: MovieWithTopic[] = []): Promise<MovieWithTopic[]> {
  await new Promise(resolve => setTimeout(resolve, 1000))
  try {
    const response = await fetch(`${BASE_URL}/${url}`, {
      method: 'GET',
      headers: {
        Cookie: `warforum_sid=${SID}`,
      },
    })

    const buffer = await response.arrayBuffer()
    const html = iconv.decode(Buffer.from(buffer), 'windows-1250')

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

function parseTopicNames(htmlContent: string, topicType: TopicType): { movies: MovieWithTopic[], nextPage: string | null } {
  const $ = cheerio.load(htmlContent)
  const movies: MovieWithTopic[] = []
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

  elements.each((i, element) => {
    const title = $(element).find('a.topictitle').text().trim()
    const url = $(element).find('a.topictitle').attr('href')!
    const topicNumber = extractTopicId(url)
    const movie = parseTopicName(title, topicType)

    const dateString = $(element).find('td:nth-child(5) .gensmall').contents().filter(function () {
      return this.type === 'text'
    }).text()

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

function extractTopicId(url: string): number {
  const match = url.match(/t=(\d+)/)
  if (!match) {
    throw new Error('Invalid topic URL')
  }
  return Number.parseInt(match[1], 10)
}

function parseTopicName(title: string, topicType: TopicType): MovieInfo | null {
  const regex = /^(?:(.*?) \/ )?(.*?) \((\d{4})\)$/
  const match = title.match(regex)

  if (!match) {
    return null
  }

  const [, first, second, yearStr] = match
  const year = Number.parseInt(yearStr, 10)

  // Pro HD a UHD je první název originální, druhý český
  // Pro HD Dub a UHD Dub je první název český, druhý originální
  const isDub = topicType === 'hdDub' || topicType === 'uhdDub'

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

async function upsertMovie(movie: MovieWithTopic, topicType: TopicType): Promise<void> {
  const isDub = topicType === 'hdDub' || topicType === 'uhdDub'
  try {
    await db.insert(schema.moviesSource).values({ ...movie, [topicType]: movie.topicNumber }).onConflictDoUpdate({
      target: isDub ? [schema.moviesSource.czechTitle, schema.moviesSource.year] : [schema.moviesSource.originalTitle, schema.moviesSource.year],
      set: {
        [topicType]: movie.topicNumber,
        updatedAt: new Date(),
      },
    })
  }
  catch {
    console.error(`Error upserting movie "${movie.czechTitle}" / "${movie.originalTitle}" (${movie.year})`)
  }
}
