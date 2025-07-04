import type { TmdbTvShowDetails } from '@repo/types'
import type { Database } from '../../connection.js'
import type { TmdbTvShowDataRepository } from './types.js'
import { tvShowsSchema } from '../../index.js'

export class TmdbTvShowDataRepo implements TmdbTvShowDataRepository {
  constructor(private readonly db: Database) {}

  async save(tvShowDetails: TmdbTvShowDetails): Promise<number> {
    // ensure atomicity using transaction
    return await this.db.transaction(async (tx) => {
    // 1) Save tv show data
      const [{ id: tmdbId }] = await tx
        .insert(tvShowsSchema.tmdbTvShowsData)
        .values(tvShowDetails)
        .returning({ id: tvShowsSchema.tmdbTvShowsData.id })

      // 2) Save genres (ignore duplicates)
      await tx
        .insert(tvShowsSchema.tmdbTvShowGenres)
        .values(tvShowDetails.genres)
        .onConflictDoNothing({ target: tvShowsSchema.tmdbTvShowGenres.id })

      // 3) Link movie to genres
      await tx
        .insert(tvShowsSchema.tmdbTvShowsToGenres)
        .values(tvShowDetails.genres.map(g => ({
          tvShowId: tmdbId,
          genreId: g.id,
        })))

      // 4) Save networks (ignore duplicates)
      await tx
        .insert(tvShowsSchema.tmdbNetworks)
        .values(tvShowDetails.networks)
        .onConflictDoNothing({ target: tvShowsSchema.tmdbNetworks.id })

      // 5) Link tv show to networks
      await tx
        .insert(tvShowsSchema.tmdbTvShowToNetworks)
        .values(tvShowDetails.networks.map(n => ({
          tvShowId: tmdbId,
          networkId: n.id,
        })))

      return tmdbId
    })
  }
}
