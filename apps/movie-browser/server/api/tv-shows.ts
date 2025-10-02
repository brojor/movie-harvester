import type { SQL } from 'drizzle-orm'
import type { SearchParams } from '../../types'
import { createDatabase, tvShowsSchema } from '@repo/database'
import { and, asc, desc, eq, exists } from 'drizzle-orm'

const { tmdbTvShowsToGenres, tvShows } = tvShowsSchema

const db = createDatabase(useRuntimeConfig().dbUrl)

function getOrderByClause(sortBy: string, order: 'asc' | 'desc'): SQL | null {
  const direction = order === 'asc' ? asc : desc

  switch (sortBy) {
    case 'title':
      return direction(tvShows.originalTitle)
    case 'releaseDate':
      return direction(tvShows.createdAt) // Použijeme createdAt jako proxy pro release date
    case 'addedDate':
      return direction(tvShows.createdAt)
    case 'rating':
      // Pro rating vrátíme null - budeme používat speciální JOIN dotazy
      return null
    default:
      return direction(tvShows.originalTitle)
  }
}

const tvShowWithRelations = {
  rtData: true,
  csfdData: { with: { genres: { with: { genre: true } } } },
  tmdbData: { with: { genres: { with: { genre: true } }, seasons: true, networks: { with: { network: true } } } },
  topics: true,
} as const

async function getTvShowsByGenre(genreId: number, limit?: number, offset?: number, orderBy?: any): Promise<any[]> {
  const tvShowsWithGenre = await db
    .select({ tvShowId: tvShows.id })
    .from(tvShows)
    .where(
      exists(
        db
          .select()
          .from(tmdbTvShowsToGenres)
          .where(
            and(
              eq(tmdbTvShowsToGenres.tvShowId, tvShows.tmdbId),
              eq(tmdbTvShowsToGenres.genreId, genreId),
            ),
          ),
      ),
    )

  const tvShowIds = tvShowsWithGenre.map(t => t.tvShowId)

  return await db.query.tvShows.findMany({
    where: (tvShows, { inArray }) => inArray(tvShows.id, tvShowIds),
    with: tvShowWithRelations,
    limit,
    offset,
    orderBy,
  })
}

async function getAllTvShows(limit?: number, offset?: number, orderBy?: any): Promise<any[]> {
  return await db.query.tvShows.findMany({
    with: tvShowWithRelations,
    limit,
    offset,
    orderBy,
  })
}

async function getAllTvShowsByRating(ratingSource: string, order: 'asc' | 'desc', limit?: number, offset?: number): Promise<any[]> {
  // Nejdříve načteme všechny seriály s relations
  const allTvShows = await db.query.tvShows.findMany({
    with: tvShowWithRelations,
  })

  // Pak je seřadíme podle ratingu v paměti
  const sortedTvShows = allTvShows.sort((a, b) => {
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
  return sortedTvShows.slice(startIndex, endIndex)
}

async function getTvShowsByGenreByRating(genreId: number, ratingSource: string, order: 'asc' | 'desc', limit?: number, offset?: number): Promise<any[]> {
  // Nejdříve najdeme seriály s daným žánrem
  const tvShowsWithGenre = await db
    .select({ tvShowId: tvShows.id })
    .from(tvShows)
    .where(
      exists(
        db
          .select()
          .from(tmdbTvShowsToGenres)
          .where(
            and(
              eq(tmdbTvShowsToGenres.tvShowId, tvShows.tmdbId),
              eq(tmdbTvShowsToGenres.genreId, genreId),
            ),
          ),
      ),
    )

  const tvShowIds = tvShowsWithGenre.map(t => t.tvShowId)

  // Načteme seriály s relations
  const tvShowsWithData = await db.query.tvShows.findMany({
    where: (tvShows, { inArray }) => inArray(tvShows.id, tvShowIds),
    with: tvShowWithRelations,
  })

  // Seřadíme podle ratingu v paměti
  const sortedTvShows = tvShowsWithData.sort((a, b) => {
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
  return sortedTvShows.slice(startIndex, endIndex)
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

  let tvShowsWithAllData: any[]

  if (sortBy === 'rating') {
    // Pro rating používáme speciální JOIN dotazy
    tvShowsWithAllData = genreId
      ? await getTvShowsByGenreByRating(genreId, ratingSource, order, limitNumber, offset)
      : await getAllTvShowsByRating(ratingSource, order, limitNumber, offset)
  }
  else {
    // Pro ostatní kritéria používáme standardní dotazy
    tvShowsWithAllData = genreId
      ? await getTvShowsByGenre(genreId, limitNumber, offset, orderByClause)
      : await getAllTvShows(limitNumber, offset, orderByClause)
  }

  return {
    data: tvShowsWithAllData,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total: tvShowsWithAllData.length,
      hasMore: tvShowsWithAllData.length === limitNumber,
    },
  }
})
