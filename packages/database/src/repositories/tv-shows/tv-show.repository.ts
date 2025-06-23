import type { TvShow } from '@repo/types'
import type { Database } from '../../connection.js'
import type { TvShowRepository } from './types.js'
import { eq } from 'drizzle-orm'
import { tvShows } from '../../schemas/tv-shows.js'

export class TvShowRepo implements TvShowRepository {
  constructor(private readonly db: Database) {}

  async addTvShow(tvShow: TvShow): Promise<number> {
    const [result] = await this.db.insert(tvShows).values(tvShow).returning({ id: tvShows.id })
    if (!result) {
      throw new Error('Failed to add tv show')
    }

    return result.id
  }

  async setCsfdId(tvShowId: number, csfdId: number): Promise<void> {
    await this.db.update(tvShows).set({ csfdId }).where(eq(tvShows.id, tvShowId))
  }

  async setTmdbId(tvShowId: number, tmdbId: number): Promise<void> {
    await this.db.update(tvShows).set({ tmdbId }).where(eq(tvShows.id, tvShowId))
  }

  async setRtId(tvShowId: number, rtId: number): Promise<void> {
    await this.db.update(tvShows).set({ rtId }).where(eq(tvShows.id, tvShowId))
  }
}
