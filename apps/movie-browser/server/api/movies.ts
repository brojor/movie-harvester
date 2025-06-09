import type { SearchParams } from '../../types'
import { commonSchema, db, moviesSchema } from '@repo/database'
import { asc, desc, eq } from 'drizzle-orm'

const { tmdbGenres } = commonSchema
const { movieSources, tmdbMovieData, rtMovieData, csfdMovieData, tmdbMoviesToGenres, csfdMoviesToGenres, csfdGenres } = moviesSchema

const ratingColumns = {
  csfd: csfdMovieData.voteAverage,
  tmdb: tmdbMovieData.voteAverage,
  rt: rtMovieData.criticsScore,
}

const sortByToColumn = {
  title: tmdbMovieData.title,
  year: tmdbMovieData.releaseDate,
  rating: ratingColumns,
  releaseDate: tmdbMovieData.releaseDate,
}

export default defineEventHandler(async (event) => {
  const { sortBy, ratingSource, order } = getQuery(event) as SearchParams

  // 1. Základní dotaz
  const movies = await db
    .select({
      movie: movieSources,
      tmdb: tmdbMovieData,
      rt: rtMovieData,
      csfd: csfdMovieData,
    })
    .from(movieSources)
    .innerJoin(tmdbMovieData, eq(movieSources.id, tmdbMovieData.sourceId))
    .leftJoin(rtMovieData, eq(movieSources.id, rtMovieData.sourceId))
    .leftJoin(csfdMovieData, eq(movieSources.id, csfdMovieData.sourceId))
    .orderBy((order === 'desc' ? desc : asc)(
      sortBy === 'rating' ? ratingColumns[ratingSource] : sortByToColumn[sortBy],
    ))

  // 2. Načtení TMDB žánrů
  const tmdbGenresMap = new Map<number, string[]>()

  const tmdbGenresJoin = await db
    .select({
      movieId: tmdbMoviesToGenres.movieId,
      genre: tmdbGenres.name,
    })
    .from(tmdbMoviesToGenres)
    .innerJoin(tmdbGenres, eq(tmdbMoviesToGenres.genreId, tmdbGenres.id))

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
      csfdId: csfdMoviesToGenres.csfdId,
      genre: csfdGenres.name,
    })
    .from(csfdMoviesToGenres)
    .innerJoin(csfdGenres, eq(csfdMoviesToGenres.genreId, csfdGenres.id))

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
