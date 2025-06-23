import type { RtDetails } from '@repo/rt-scraper'
import type { Database } from '../../connection.js'
import type { RtTvShowDataRepository } from './types.js'
import { tvShowsSchema } from '../../index.js'

export class RtTvShowDataRepo implements RtTvShowDataRepository {
  constructor(private readonly db: Database) {}

  async save(tvShowDetails: RtDetails): Promise<string> {
    const [{ id: rtId }] = await this.db
      .insert(tvShowsSchema.rtTvShowData)
      .values(tvShowDetails)
      .returning({ id: tvShowsSchema.rtTvShowData.id })

    return rtId
  }
}
