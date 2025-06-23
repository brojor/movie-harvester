import type { Movie } from '@repo/types'
import type { Database } from '../../connection.js'
import type { MovieRepository } from './types.js'
import { eq } from 'drizzle-orm'
import { movies } from '../../schemas/movies.js'

export class MovieRepo implements MovieRepository {
  constructor(private readonly db: Database) {}

  async addMovie(movie: Movie): Promise<number> {
    const [result] = await this.db.insert(movies).values(movie).returning({ id: movies.id })
    if (!result) {
      throw new Error('Failed to add movie')
    }

    return result.id
  }

  async setCsfdId(movieId: number, csfdId: number): Promise<void> {
    await this.db.update(movies).set({ csfdId }).where(eq(movies.id, movieId))
  }

  async setTmdbId(movieId: number, tmdbId: number): Promise<void> {
    await this.db.update(movies).set({ tmdbId }).where(eq(movies.id, movieId))
  }

  async setRtId(movieId: number, rtId: number): Promise<void> {
    await this.db.update(movies).set({ rtId }).where(eq(movies.id, movieId))
  }
}
