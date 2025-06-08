import type { SearchParams } from '../../types'
import { db, schema } from '@repo/database'
import { asc, desc, eq } from 'drizzle-orm'

const { moviesSource, tmdbData, rtData, csfdData, tmdbToGenres, tmdbGenres, csfdToGenres, csfdGenres } = schema

const ratingColumns = {
  csfd: csfdData.voteAverage,
  tmdb: tmdbData.voteAverage,
  rt: rtData.criticsScore,
}

const sortByToColumn = {
  title: tmdbData.title,
  year: tmdbData.releaseDate,
  rating: ratingColumns,
  releaseDate: tmdbData.releaseDate,
}

export default defineEventHandler(async (event) => {
  const { sortBy, ratingSource, order } = getQuery(event) as SearchParams

  // 1. Základní dotaz
  const movies = await db
    .select({
      movie: moviesSource,
      tmdb: tmdbData,
      rt: rtData,
      csfd: csfdData,
    })
    .from(moviesSource)
    .innerJoin(tmdbData, eq(moviesSource.id, tmdbData.sourceId))
    .leftJoin(rtData, eq(moviesSource.id, rtData.sourceId))
    .leftJoin(csfdData, eq(moviesSource.id, csfdData.sourceId))
    .orderBy((order === 'desc' ? desc : asc)(
      sortBy === 'rating' ? ratingColumns[ratingSource] : sortByToColumn[sortBy],
    ))

  // 2. Načtení TMDB žánrů
  const tmdbGenresMap = new Map<number, string[]>()

  const tmdbGenresJoin = await db
    .select({
      movieId: tmdbToGenres.movieId,
      genre: tmdbGenres.name,
    })
    .from(tmdbToGenres)
    .innerJoin(tmdbGenres, eq(tmdbToGenres.genreId, tmdbGenres.id))

  for (const { movieId, genre } of tmdbGenresJoin) {
    if (!tmdbGenresMap.has(movieId)) {
      tmdbGenresMap.set(movieId, [])
    }
    tmdbGenresMap.get(movieId)!.push(genre)
  }

  // 3. Načtení CSFD žánrů
  const csfdGenresMap = new Map<number, string[]>()

  const csfdGenresJoin = await db
    .select({
      csfdId: csfdToGenres.csfdId,
      genre: csfdGenres.name,
    })
    .from(csfdToGenres)
    .innerJoin(csfdGenres, eq(csfdToGenres.genreId, csfdGenres.id))

  for (const { csfdId, genre } of csfdGenresJoin) {
    if (!csfdGenresMap.has(csfdId)) {
      csfdGenresMap.set(csfdId, [])
    }
    csfdGenresMap.get(csfdId)!.push(genre)
  }

  // 4. Složení finálního výsledku
  const enriched = movies.map(item => ({
    ...item,
    tmdbGenres: item.tmdb?.id ? tmdbGenresMap.get(item.tmdb.id) ?? [] : [],
    csfdGenres: item.csfd?.id ? csfdGenresMap.get(item.csfd.id) ?? [] : [],
  }))

  return enriched
})
