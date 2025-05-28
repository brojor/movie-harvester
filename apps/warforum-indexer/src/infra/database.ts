import type { MovieWithTopicId, TopicKey } from '../types/domain.js'
import { db, schema } from '@repo/database'
import { TOPIC_META } from '../types/domain.js'

export async function upsertMovie(
  movie: MovieWithTopicId,
  topicType: TopicKey,
): Promise<void> {
  const isDub = TOPIC_META[topicType].isDub
  try {
    await db
      .insert(schema.moviesSource)
      .values({ ...movie, [topicType]: movie.topicNumber })
      .onConflictDoUpdate({
        target: isDub
          ? [schema.moviesSource.czechTitle, schema.moviesSource.year]
          : [schema.moviesSource.originalTitle, schema.moviesSource.year],
        set: {
          [topicType]: movie.topicNumber,
          updatedAt: new Date(),
        },
      })
  }
  catch (err) {
    console.error(
      `Error upserting movie \"${movie.czechTitle}\" / \"${movie.originalTitle}\" (${movie.year})`,
      err,
    )
  }
}
