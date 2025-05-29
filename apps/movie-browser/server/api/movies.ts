import type { schema } from '@repo/database'
import { db } from '@repo/database'
import { map } from 'lodash-es'

type TmdbDataWithRelations = typeof schema.tmdbData.$inferSelect & {
  genres: Array<{
    genre: typeof schema.genres.$inferSelect
  }>
}

export default defineEventHandler(async () => {
  const movies = await db.query.moviesSource.findMany({
    with: {
      csfdData: true,
      tmdbData: {
        with: {
          genres: {
            with: {
              genre: true,
            },
          },
        },
      },
    },
  })
  return movies.map(({ csfdData, tmdbData }) => {
    const { voteCount: tmdbVoteCount, voteAverage: tmdbVoteAverage, genres: tmdbGenres, ...rest } = tmdbData as TmdbDataWithRelations
    const { voteCount: csfdVoteCount, voteAverage: csfdVoteAverage } = csfdData

    return {
      ...rest,
      overview: tmdbData.overview || csfdData.overview,
      genres: map(tmdbGenres, 'genre.name') as string[],
      tmdbVoteCount,
      tmdbVoteAverage: tmdbVoteAverage * 10,
      csfdVoteCount,
      csfdVoteAverage,
    }
  })
})
