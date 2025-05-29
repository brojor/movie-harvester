import type { MovieSource } from '../infra/database.js'
import type { Movie } from '../types/domain.js'
import { TOPIC_META, TopicKey } from '../types/domain.js'

export function extractTopicId(url: string): number {
  const match = url.match(/t=(\d+)/)
  if (!match) {
    throw new Error('Invalid topic URL')
  }
  return Number.parseInt(match[1], 10)
}

export function parseTopicName(title: string, topicType: TopicKey): Movie | null {
  const regex = /^(?:(.*?) \/ )?(.*?) \((\d{4})\)$/
  const match = title.match(regex)

  if (!match) {
    return null
  }

  const [, first, second, yearStr] = match
  const year = Number.parseInt(yearStr, 10)

  const isDub = TOPIC_META[topicType].isDub

  return {
    czechTitle: isDub ? (first || second).trim() : second.trim(),
    originalTitle: isDub ? second.trim() : (first || second).trim(),
    year,
  }
}

export function getTopicId(movie: MovieSource): number {
  for (const key of Object.values(TopicKey)) {
    const value = movie[key]
    if (value) {
      return value
    }
  }
  throw new Error('No topic ID found')
}
