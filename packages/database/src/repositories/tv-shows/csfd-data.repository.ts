import type { CsfdTvShowDetails } from '@repo/types'
import type { Database } from '../../connection.js'
import type { CsfdTvShowDataRepository } from './types.js'
import { commonSchema, tvShowsSchema } from '../../index.js'

export class CsfdTvShowDataRepo implements CsfdTvShowDataRepository {
  constructor(private readonly db: Database) {}

  async save(tvShowDetails: CsfdTvShowDetails): Promise<number> {
    // ensure atomicity using transaction
    return await this.db.transaction(async (tx) => {
    // 1) Save tv show data
      const [{ id: csfdId }] = await tx
        .insert(tvShowsSchema.csfdTvShowData)
        .values(tvShowDetails)
        .returning({ id: tvShowsSchema.csfdTvShowData.id })

      // 2) Save genres (ignore duplicates)
      await tx
        .insert(commonSchema.csfdGenres)
        .values(tvShowDetails.genres)
        .onConflictDoNothing({ target: commonSchema.csfdGenres.id })

      // 3) Link tv show to genres
      await tx
        .insert(tvShowsSchema.csfdTvShowsToGenres)
        .values(
          tvShowDetails.genres.map(g => ({
            csfdId,
            genreId: g.id,
          })),
        )

      return csfdId
    })
  }
}
