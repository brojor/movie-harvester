import type { SQL } from 'drizzle-orm'
import type { SearchParams } from '../../types'
import { createDatabase, moviesSchema } from '@repo/database'
import { and, asc, desc, eq, exists } from 'drizzle-orm'

const { tmdbMoviesToGenres, movies } = moviesSchema

const db = createDatabase(useRuntimeConfig().dbUrl)

function getOrderByClause(sortBy: string, order: 'asc' | 'desc'): SQL | null {
  const direction = order === 'asc' ? asc : desc

  switch (sortBy) {
    case 'title':
      return direction(movies.czechTitle)
    case 'releaseDate':
      return direction(movies.year)
    case 'addedDate':
      return direction(movies.createdAt)
    case 'rating':
      // Pro rating vrátíme null - budeme používat speciální JOIN dotazy
      return null
    default:
      return direction(movies.czechTitle)
  }
}

const movieWithRelations = {
  rtData: true,
  csfdData: { with: { genres: { with: { genre: true } } } },
  tmdbData: { with: { genres: { with: { genre: true } } } },
  topics: true,
} as const

async function getMoviesByGenre(genreId: number, limit?: number, offset?: number, orderBy?: any): Promise<any[]> {
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
    with: movieWithRelations,
    limit,
    offset,
    orderBy,
  })
}

async function getAllMovies(limit?: number, offset?: number, orderBy?: any): Promise<any[]> {
  return await db.query.movies.findMany({
    with: movieWithRelations,
    limit,
    offset,
    orderBy,
  })
}

async function getAllMoviesByRating(ratingSource: string, order: 'asc' | 'desc', limit?: number, offset?: number): Promise<any[]> {
  // Nejdříve načteme všechny filmy s relations
  const allMovies = await db.query.movies.findMany({
    with: movieWithRelations,
  })

  // Pak je seřadíme podle ratingu v paměti
  const sortedMovies = allMovies.sort((a, b) => {
    let aValue = 0
    let bValue = 0

    switch (ratingSource) {
      case 'tmdb':
        aValue = a.tmdbData?.voteAverage ?? 0
        bValue = b.tmdbData?.voteAverage ?? 0
        break
      case 'csfd':
        aValue = a.csfdData?.voteAverage ?? 0
        bValue = b.csfdData?.voteAverage ?? 0
        break
      case 'rt':
        aValue = a.rtData?.criticsScore ?? 0
        bValue = b.rtData?.criticsScore ?? 0
        break
    }

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return order === 'asc' ? comparison : -comparison
  })

  // Aplikujeme limit a offset
  const startIndex = offset ?? 0
  const endIndex = startIndex + (limit ?? 20)
  return sortedMovies.slice(startIndex, endIndex)
}

async function getMoviesByGenreByRating(genreId: number, ratingSource: string, order: 'asc' | 'desc', limit?: number, offset?: number): Promise<any[]> {
  // Nejdříve najdeme filmy s daným žánrem
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

  // Načteme filmy s relations
  const moviesWithData = await db.query.movies.findMany({
    where: (movies, { inArray }) => inArray(movies.id, movieIds),
    with: movieWithRelations,
  })

  // Seřadíme podle ratingu v paměti
  const sortedMovies = moviesWithData.sort((a, b) => {
    let aValue = 0
    let bValue = 0

    switch (ratingSource) {
      case 'tmdb':
        aValue = a.tmdbData?.voteAverage ?? 0
        bValue = b.tmdbData?.voteAverage ?? 0
        break
      case 'csfd':
        aValue = a.csfdData?.voteAverage ?? 0
        bValue = b.csfdData?.voteAverage ?? 0
        break
      case 'rt':
        aValue = a.rtData?.criticsScore ?? 0
        bValue = b.rtData?.criticsScore ?? 0
        break
    }

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return order === 'asc' ? comparison : -comparison
  })

  // Aplikujeme limit a offset
  const startIndex = offset ?? 0
  const endIndex = startIndex + (limit ?? 20)
  return sortedMovies.slice(startIndex, endIndex)
}

export default defineEventHandler(async (event) => {
  const {
    sortBy = 'title',
    ratingSource = 'tmdb',
    order = 'asc',
    genreId,
    page = 1,
    limit = 20,
  } = getQuery(event) as SearchParams

  const pageNumber = Number(page)
  const limitNumber = Number(limit)
  const offset = (pageNumber - 1) * limitNumber

  const orderByClause = getOrderByClause(sortBy, order)

  let moviesWithAllData: any[]

  if (sortBy === 'rating') {
    // Pro rating používáme speciální JOIN dotazy
    moviesWithAllData = genreId
      ? await getMoviesByGenreByRating(genreId, ratingSource, order, limitNumber, offset)
      : await getAllMoviesByRating(ratingSource, order, limitNumber, offset)
  }
  else {
    // Pro ostatní kritéria používáme standardní dotazy
    moviesWithAllData = genreId
      ? await getMoviesByGenre(genreId, limitNumber, offset, orderByClause)
      : await getAllMovies(limitNumber, offset, orderByClause)
  }

  return {
    data: moviesWithAllData,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total: moviesWithAllData.length,
      hasMore: moviesWithAllData.length === limitNumber,
    },
  }
})
