import type { CsfdMovieDetails } from '@repo/types'
import type { Database } from '../../connection.js'
import type { CsfdMovieDataRepository } from './types.js'
import { commonSchema, moviesSchema } from '../../index.js'

export class CsfdMovieDataRepo implements CsfdMovieDataRepository {
  constructor(private readonly db: Database) {}

  async save(movieDetails: CsfdMovieDetails): Promise<number> {
    // ensure atomicity using transaction
    return await this.db.transaction(async (tx) => {
    // 1) Save movie data
      const [{ id: csfdId }] = await tx
        .insert(moviesSchema.csfdMovieData)
        .values(movieDetails)
        .returning({ id: moviesSchema.csfdMovieData.id })

      // 2) Save genres (ignore duplicates)
      if (movieDetails.genres.length > 0) {
        await tx
          .insert(commonSchema.csfdGenres)
          .values(movieDetails.genres)
          .onConflictDoNothing({ target: commonSchema.csfdGenres.id })

        // 3) Link movie to genres
        await tx
          .insert(moviesSchema.csfdMoviesToGenres)
          .values(
            movieDetails.genres.map(g => ({
              csfdId,
              genreId: g.id,
            })),
          )
      }

      return csfdId
    })
  }
}
