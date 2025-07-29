import type { Movie } from '@repo/types'
import type { Database, Transaction } from '../../connection.js'
import type { MovieRecord } from '../../types.js'
import type { MovieRepository } from './types.js'
import { and, desc, eq, or } from 'drizzle-orm'
import { movies } from '../../schemas/movies.js'

export class MovieRepo implements MovieRepository {
  constructor(private readonly db: Database | Transaction) {}

  async find(movie: Movie): Promise<MovieRecord | null> {
    const conditions = []

    if (movie.czechTitle) {
      conditions.push(and(eq(movies.czechTitle, movie.czechTitle), eq(movies.year, movie.year)))
    }

    if (movie.originalTitle) {
      conditions.push(and(eq(movies.originalTitle, movie.originalTitle), eq(movies.year, movie.year)))
    }

    if (conditions.length > 0) {
      const [existing] = await this.db.select().from(movies).where(or(...conditions))
      return existing || null
    }

    return null
  }

  async create(movie: Movie): Promise<MovieRecord> {
    const [result] = await this.db.insert(movies).values(movie).returning()
    return result
  }

  async setCsfdId(movieId: number, csfdId: number): Promise<void> {
    await this.db.update(movies).set({ csfdId, updatedAt: new Date() }).where(eq(movies.id, movieId))
  }

  async setTmdbId(movieId: number, tmdbId: number): Promise<void> {
    await this.db.update(movies).set({ tmdbId, updatedAt: new Date() }).where(eq(movies.id, movieId))
  }

  async setRtId(movieId: number, rtId: string): Promise<void> {
    await this.db.update(movies).set({ rtId, updatedAt: new Date() }).where(eq(movies.id, movieId))
  }

  async getLastUpdateDate(): Promise<Date> {
    const [result] = await this.db.select({ updatedAt: movies.updatedAt }).from(movies).orderBy(desc(movies.updatedAt)).limit(1)
    return result?.updatedAt ?? new Date(0)
  }
}
