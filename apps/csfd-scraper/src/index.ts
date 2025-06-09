import { URLSearchParams } from 'node:url'
import { db, moviesSchema } from '@repo/database'

import { getThrottledClient } from '@repo/shared'
import { getCsfdIdFromTopic } from '@repo/warforum-indexer'
import * as cheerio from 'cheerio'
import { and, desc, eq, gt, inArray, isNull } from 'drizzle-orm'
import genres from './genres.json' with { type: 'json' }

interface CsfdData {
  title: string
  originalTitle: string
  releaseYear: number
  runtime: number | null
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

export async function populateCsfdData(): Promise<void> {
  await seedCsfdGenres()
  const latestCsfdData = await db.select().from(moviesSchema.csfdMovieData).orderBy(desc(moviesSchema.csfdMovieData.createdAt)).limit(1)
  const res = await db.select().from(moviesSchema.movieSources).leftJoin(moviesSchema.csfdMovieData, eq(moviesSchema.movieSources.id, moviesSchema.csfdMovieData.sourceId)).where(and(isNull(moviesSchema.csfdMovieData.id), gt(moviesSchema.movieSources.createdAt, latestCsfdData[0].createdAt)))
  const movies = res.map(m => m.movie_sources)
  for (const movie of movies) {
    let csfdId

    if (movie.czechTitle) {
      csfdId = await getCsfdId(movie.czechTitle, movie.year)
    }

    if (!csfdId) {
      csfdId = await getCsfdIdFromTopic(movie)
      if (!csfdId) {
        console.error(`Movie ${movie.czechTitle} (${movie.year}) not found`)
        continue
      }
    }
    const csfdData = await fetchCsfdData(csfdId)

    const csfdDataId = await db.insert(moviesSchema.csfdMovieData).values({
      sourceId: movie.id,
      ...csfdData,
    }).returning({ id: moviesSchema.csfdMovieData.id })

    const genreIds = await db
      .select({ id: moviesSchema.csfdGenres.id })
      .from(moviesSchema.csfdGenres)
      .where(inArray(moviesSchema.csfdGenres.name, csfdData.genres))

    await db.insert(moviesSchema.csfdMoviesToGenres).values(
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
  const origin = $('.film-info .origin').text().trim()
  const [countries, releaseYear, runtimeString] = origin.split(', ').map(part => part.trim())
  const originalTitle = $('ul.film-names')
    .children()
    .filter(function () {
      const country = $(this).find('img').attr('title')
      return country === countries.split('/')[0].trim()
    })
    .first()
    .contents()
    .filter(function () {
      return this.type === 'text'
    })
    .text()
    .trim()
  const runtime = runtimeString ? Number.parseInt(runtimeString.replace('min', '')) : null
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
    originalTitle: originalTitle || title,
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
  await db.insert(moviesSchema.csfdGenres).values(genres).onConflictDoNothing()
}
