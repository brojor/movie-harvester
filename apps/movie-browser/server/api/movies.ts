import type { SearchParams } from '../../types'
import { createDatabase } from '@repo/database'

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

export default defineEventHandler(async (event) => {
  const { sortBy, ratingSource, order } = getQuery(event) as SearchParams

  const moviesWithAllData = await db.query.movies.findMany({
    with: {
      rtData: true,
      csfdData: { with: { genres: { with: { genre: true } } } },
      tmdbData: { with: { genres: { with: { genre: true } } } },
    },
  })

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
