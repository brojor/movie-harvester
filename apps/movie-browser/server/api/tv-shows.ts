import type { SearchParams } from '../../types'
import { createDatabase, tvShowsSchema } from '@repo/database'
import { and, eq, exists } from 'drizzle-orm'

const { tmdbTvShowsToGenres, tvShows } = tvShowsSchema

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
      return movie.tmdbData?.name ?? ''
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

async function getTvShowsByGenre(genreId: number): Promise<any[]> {
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
    with: {
      rtData: true,
      csfdData: { with: { genres: { with: { genre: true } } } },
      tmdbData: { with: { genres: { with: { genre: true } }, seasons: true, networks: { with: { network: true } } } },
    },
  })
}

async function getAllTvShows(): Promise<any[]> {
  return await db.query.tvShows.findMany({
    with: {
      rtData: true,
      csfdData: { with: { genres: { with: { genre: true } } } },
      tmdbData: { with: { genres: { with: { genre: true } }, seasons: true, networks: { with: { network: true } } } },
    },
  })
}

export default defineEventHandler(async (event) => {
  const { sortBy, ratingSource, order, genreId } = getQuery(event) as SearchParams

  const tvShowsWithAllData = genreId
    ? await getTvShowsByGenre(genreId)
    : await getAllTvShows()

  const sortedTvShows = tvShowsWithAllData.sort((a, b) => {
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

  return sortedTvShows
})
