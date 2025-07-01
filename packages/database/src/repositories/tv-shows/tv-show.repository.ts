import type { TvShow } from '@repo/types'
import type { Database, Transaction } from '../../connection.js'
import type { TvShowRecord } from '../../types.js'
import type { TvShowRepository } from './types.js'
import { desc, eq, or } from 'drizzle-orm'
import { tvShows } from '../../schemas/tv-shows.js'

export class TvShowRepo implements TvShowRepository {
  constructor(private readonly db: Database | Transaction) { }

  async firstOrCreate(tvShow: TvShow): Promise<TvShowRecord> {
    const [result] = await this.db.insert(tvShows).values(tvShow).onConflictDoNothing().returning()
    if (result)
      return result

    const [existing] = await this.db
      .select()
      .from(tvShows)
      .where(
        or(
          eq(tvShows.czechTitle, tvShow.czechTitle),
          eq(tvShows.originalTitle, tvShow.originalTitle),
        ),
      )

    if (existing)
      return existing

    throw new Error(`Failed to add tv show: ${JSON.stringify(tvShow)}`)
  }

  async setCsfdId(tvShowId: number, csfdId: number): Promise<void> {
    await this.db.update(tvShows).set({ csfdId }).where(eq(tvShows.id, tvShowId))
  }

  async setTmdbId(tvShowId: number, tmdbId: number): Promise<void> {
    await this.db.update(tvShows).set({ tmdbId }).where(eq(tvShows.id, tvShowId))
  }

  async setRtId(tvShowId: number, rtId: string): Promise<void> {
    await this.db.update(tvShows).set({ rtId }).where(eq(tvShows.id, tvShowId))
  }

  async getLastUpdateDate(): Promise<Date> {
    const [result] = await this.db.select({ updatedAt: tvShows.updatedAt }).from(tvShows).orderBy(desc(tvShows.updatedAt)).limit(1)
    return result?.updatedAt ?? new Date(0)
  }
}
