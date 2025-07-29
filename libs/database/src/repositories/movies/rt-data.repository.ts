import type { RtDetails } from '@repo/types'
import type { Database } from '../../connection.js'
import type { RtMovieDataRepository } from './types.js'
import { moviesSchema } from '../../index.js'

export class RtMovieDataRepo implements RtMovieDataRepository {
  constructor(private readonly db: Database) {}

  async save(movieDetails: RtDetails): Promise<string> {
    const [{ id: rtId }] = await this.db
      .insert(moviesSchema.rtMovieData)
      .values(movieDetails)
      .returning({ id: moviesSchema.rtMovieData.id })

    return rtId
  }
}
