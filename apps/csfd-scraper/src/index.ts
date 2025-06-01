import { URLSearchParams } from 'node:url'
import { db, schema } from '@repo/database'
import { getThrottledClient } from '@repo/shared'
import * as cheerio from 'cheerio'
import { inArray } from 'drizzle-orm'
import genres from './genres.json' with { type: 'json' }

interface CsfdData {
  title: string
  originalTitle: string
  releaseYear: number
  runtime: number
  voteAverage: number
  voteCount: number
  posterPath: string
  overview: string
  genres: string[]
  csfdId: string
}

const httpClient = getThrottledClient('https://www.csfd.cz', {
  delayMs: [1000, 5000],
})

async function main(): Promise<void> {
  await seedCsfdGenres()
  await populateCsfdData()
}

main()

async function populateCsfdData(): Promise<void> {
  const movies = await db.select().from(schema.moviesSource)
  for (const movie of movies) {
    const csfdId = await getCsfdId(movie.czechTitle, movie.year)
    if (!csfdId) {
      console.error(`Movie ${movie.czechTitle} (${movie.year}) not found`)
      continue
    }
    const csfdData = await fetchCsfdData(csfdId)

    const csfdDataId = await db.insert(schema.csfdData).values({
      sourceId: movie.id,
      ...csfdData,
    }).returning({ id: schema.csfdData.id })

    const genreIds = await db
      .select({ id: schema.csfdGenres.id })
      .from(schema.csfdGenres)
      .where(inArray(schema.csfdGenres.name, csfdData.genres))

    await db.insert(schema.csfdToGenres).values(
      genreIds.map(genre => ({
        csfdId: csfdDataId[0].id,
        genreId: genre.id,
      })),
    )
  }
}

async function getCsfdId(title: string, year: number): Promise<string | null> {
  const params = {
    q: `${title} ${year}`,
    series: '0',
    creators: '0',
    users: '0',
  }
  const queryString = new URLSearchParams(params).toString()
  const html = await httpClient.get(`/hledat/?${queryString}`)

  const $ = cheerio.load(html)
  const url = $('#snippet--containerFilms .film-title-nooverflow').filter(function () {
    const text = $(this).text().trim()
    const searchText = `${title} (${year})`
    return text.toLocaleLowerCase() === searchText.toLocaleLowerCase()
  }).find('a').attr('href')

  if (!url) {
    console.error(`Movie ${title} ${year} not found`)
    return null
  }

  const parts = url.split('/').filter(Boolean)
  return parts[parts.length - 1]
}

async function fetchCsfdData(csfdId: string): Promise<CsfdData> {
  const html = await httpClient.get(`/film/${csfdId}/prehled/`)
  const $ = cheerio.load(html)

  const title = $('h1').text().trim()
  const originalTitle = $('ul.film-names').children().first().contents().filter(function () {
    return this.type === 'text'
  }).text().trim()
  const origin = $('.film-info .origin').text().trim()
  const [_country, releaseYear, runtimeString] = origin.split(', ').map(part => part.trim())
  const runtime = Number.parseInt(runtimeString.replace('min', ''))
  const voteAverage = Number.parseInt($('.film-info .film-rating-average').text().trim().replace(/\D/g, '')) || 0
  const voteCount = Number.parseInt($('li.ratings-btn span.counter').text().trim().replace('(', '').replace(/\D/g, '')) || 0

  const posterSrcSet = $('.film-posters').find('img').attr('srcset') ?? ''
  const sources = posterSrcSet.split(',').map(src => src.trim())
  const highestRes = sources[sources.length - 1]
  const posterPath = highestRes.split(' ')[0].split('/').slice(-3).join('/')
  const overview = $('.plot-full p').find('em').remove().end().text().trim()
  const genres = $('.genres').text().split('/').map(genre => genre.trim()).filter(Boolean)

  return {
    title,
    originalTitle,
    releaseYear: Number.parseInt(releaseYear),
    runtime,
    voteAverage,
    voteCount,
    posterPath,
    overview,
    genres,
    csfdId,
  }
}

async function seedCsfdGenres(): Promise<void> {
  await db.insert(schema.csfdGenres).values(genres).onConflictDoNothing()
}
