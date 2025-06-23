import type { TmdbMovieDetails } from 'libs/tmdb-fetcher/dist/index.js'
import type { Database } from '../../connection.js'
import type { TmdbMovieDataRepository } from './types.js'
import { moviesSchema } from '../../index.js'

export class TmdbMovieDataRepo implements TmdbMovieDataRepository {
  constructor(private readonly db: Database) {}

  async save(movieDetails: TmdbMovieDetails): Promise<number> {
    // ensure atomicity using transaction
    return await this.db.transaction(async (tx) => {
    // 1) Save movie data
      const [{ id: tmdbId }] = await tx
        .insert(moviesSchema.tmdbMovieData)
        .values(movieDetails)
        .returning({ id: moviesSchema.tmdbMovieData.id })

      // 2) Save genres (ignore duplicates)
      await tx
        .insert(moviesSchema.tmdbMovieGenres)
        .values(movieDetails.genres)
        .onConflictDoNothing({ target: moviesSchema.tmdbMovieGenres.id })

      // 3) Link movie to genres
      await tx
        .insert(moviesSchema.tmdbMoviesToGenres)
        .values(movieDetails.genres.map(g => ({
          movieId: tmdbId,
          genreId: g.id,
        })))

      return tmdbId
    })
  }
}
