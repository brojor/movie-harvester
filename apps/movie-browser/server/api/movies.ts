import { db } from '@repo/database'
import { map } from 'lodash-es'

export default defineEventHandler(async () => {
  const movies = await db.query.tmdbInfo.findMany({
    with: {
      movieGenres: {
        with: {
          genre: true,
        },
      },
    },
  })
  return movies.map(({ movieGenres, ...movie }) => ({
    ...movie,
    genres: map(movieGenres, 'genre.name') as string[],
  }))
})
