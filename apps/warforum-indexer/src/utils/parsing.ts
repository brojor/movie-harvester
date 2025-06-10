import type { MovieSource } from '@repo/types'
import type { DubbedMovieCoreMeta, NonDubbedMovieCoreMeta, TvShowCoreMeta } from '../types/domain.js'
import { movieTopicIdMap } from '../types/domain.js'

export function extractTopicId(url: string): number {
  const match = url.match(/t=(\d+)/)
  if (!match) {
    throw new Error('Invalid topic URL')
  }
  return Number.parseInt(match[1], 10)
}

export function parseMovieCoreMeta(topicTitle: string, isDubbed: false): NonDubbedMovieCoreMeta | null
export function parseMovieCoreMeta(topicTitle: string, isDubbed: true): DubbedMovieCoreMeta | null
export function parseMovieCoreMeta(topicTitle: string, isDubbed: boolean): NonDubbedMovieCoreMeta | DubbedMovieCoreMeta | null {
  const regex = /^(?:(.*?) \/ )?(.*?) \((\d{4})\)$/
  const match = topicTitle.match(regex)

  if (!match) {
    console.error(`Invalid topic title: "${topicTitle}"`)
    return null
  }

  const [, first, second, yearStr] = match

  if (!second || !yearStr) {
    console.error(`Missing required fields in: "${topicTitle}"`)
    return null
  }

  const year = Number.parseInt(yearStr, 10)

  if (!isDubbed) {
    return {
      originalTitle: (first || second).trim(),
      czechTitle: first ? second.trim() : undefined,
      year,
    }
  }
  return {
    czechTitle: (first || second).trim(),
    originalTitle: first ? second.trim() : undefined,
    year,
  }
}

export function getTopicId(movie: MovieSource): number {
  for (const key of Object.values(movieTopicIdMap)) {
    const value = movie[key]
    if (value) {
      return value
    }
  }
  throw new Error('No topic ID found')
}

export function parseTvShowCoreMeta(topicTitle: string): TvShowCoreMeta | null {
  const parts = topicTitle.split('/').map(part => part.trim())

  if (parts.length < 2) {
    throw new Error(`Invalid topic title: "${topicTitle}"`)
  }

  const languagesPart = parts.pop()
  const originalTitle = parts.pop()
  const czechTitle = parts.length > 0 ? parts[0] : undefined

  if (!originalTitle || !languagesPart) {
    throw new Error(`Invalid topic title: "${topicTitle}"`)
  }

  return {
    czechTitle,
    originalTitle,
    languages: languagesPart.split(',').map(lang => lang.trim()),
  }
}
