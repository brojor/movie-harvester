import type { SearchParams } from '../../types'
import { createDatabase, moviesSchema } from '@repo/database'
import { and, eq, exists } from 'drizzle-orm'

const { tmdbMoviesToGenres, movies } = moviesSchema

const db = createDatabase()

function getRatingValue(movie: any, ratingSource: string): number {
  switch (ratingSource) {
    case 'csfd':
      return movie.csfdData?.voteAverage ?? 0
    case 'tmdb':
      return movie.tmdbData?.voteAverage ?? 0
    case 'rt':
      return movie.rtData?.criticsScore ?? 0
    default:
      throw new Error(`Invalid ratingSource: ${ratingSource}`)
  }
}

function getSortValue(movie: any, sortBy: string): string | number {
  switch (sortBy) {
    case 'rating':
      throw new Error('Use getRatingValue for rating sorting')
    case 'releaseDate':
      return movie.tmdbData?.releaseDate ?? ''
    case 'title':
      return movie.tmdbData?.title ?? ''
    case 'addedDate':
      return movie.createdAt ?? ''
    default:
      throw new Error(`Invalid sortBy: ${sortBy}`)
  }
}

function compareValues(a: any, b: any, order: 'asc' | 'desc', sortBy?: string): number {
  const comparison = sortBy === 'title'
    ? String(a).localeCompare(String(b), 'cs')
    : a < b ? -1 : a > b ? 1 : 0

  return order === 'asc' ? comparison : -comparison
}

async function getMoviesByGenre(genreId: number): Promise<any[]> {
  const moviesWithGenre = await db
    .select({ movieId: movies.id })
    .from(movies)
    .where(
      exists(
        db
          .select()
          .from(tmdbMoviesToGenres)
          .where(
            and(
              eq(tmdbMoviesToGenres.movieId, movies.tmdbId),
              eq(tmdbMoviesToGenres.genreId, genreId),
            ),
          ),
      ),
    )

  const movieIds = moviesWithGenre.map(m => m.movieId)

  return await db.query.movies.findMany({
    where: (movies, { inArray }) => inArray(movies.id, movieIds),
    with: {
      rtData: true,
      csfdData: { with: { genres: { with: { genre: true } } } },
      tmdbData: { with: { genres: { with: { genre: true } } } },
    },
  })
}

async function getAllMovies(): Promise<any[]> {
  return await db.query.movies.findMany({
    with: {
      rtData: true,
      csfdData: { with: { genres: { with: { genre: true } } } },
      tmdbData: { with: { genres: { with: { genre: true } } } },
    },
  })
}

export default defineEventHandler(async (event) => {
  const { sortBy, ratingSource, order, genreId } = getQuery(event) as SearchParams

  const moviesWithAllData = genreId
    ? await getMoviesByGenre(genreId)
    : await getAllMovies()

  const sortedMovies = moviesWithAllData.sort((a, b) => {
    if (sortBy === 'rating') {
      const aValue = getRatingValue(a, ratingSource)
      const bValue = getRatingValue(b, ratingSource)
      return compareValues(aValue, bValue, order)
    }
    else {
      const aValue = getSortValue(a, sortBy)
      const bValue = getSortValue(b, sortBy)
      return compareValues(aValue, bValue, order, sortBy)
    }
  })

  return sortedMovies
})
