import type { DubbedMovie, MediaType, NonDubbedMovie, TopicType, TvShow } from '@repo/types'
import type { MovieMetaWithSource, TvShowMetaWithSource } from '../types/domain.js'

export function extractTopicId(url: string): number | null {
  const match = url.match(/t=(\d+)/)
  if (!match) {
    console.error(`Invalid topic URL: "${url}"`)
    return null
  }
  return Number.parseInt(match[1], 10)
}

export function parseMovieCoreMeta(topicTitle: string, isDubbed: false): NonDubbedMovie | null
export function parseMovieCoreMeta(topicTitle: string, isDubbed: true): DubbedMovie | null
export function parseMovieCoreMeta(topicTitle: string, isDubbed: boolean): NonDubbedMovie | DubbedMovie | null {
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

// export function getMovieTopicId(movie: Movie): number | null {
//   for (const key of Object.values(movieTopicIdMap)) {
//     const value = movie[key]
//     if (value) {
//       return value
//     }
//   }
//   console.error(`No topic ID found for movie: "${movie.id}"`)
//   return null
// }

export function parseTvShowCoreMeta(topicTitle: string): TvShow | null {
  const parts = removeParentheses(topicTitle).split('/').map(part => part.trim())

  if (parts.length < 2) {
    console.error(`Invalid topic title: "${topicTitle}"`)
    return null
  }

  const languagesPart = parts.pop()
  const originalTitle = parts.pop()
  const czechTitle = parts.length > 0 ? parts[0] : undefined

  if (!originalTitle || !languagesPart) {
    console.error(`Invalid topic title: "${topicTitle}"`)
    return null
  }

  return {
    czechTitle,
    originalTitle,
    languages: languagesPart.split(',').map(lang => lang.trim()),
  }
}

export function parseMediaItem(
  title: string,
  sourceTopic: number,
  mediaType: MediaType,
  topicType: TopicType,
): MovieMetaWithSource | TvShowMetaWithSource | null {
  if (mediaType === 'movie') {
    const coreMeta = topicType.endsWith('Dub')
      ? parseMovieCoreMeta(title, true)
      : parseMovieCoreMeta(title, false)

    return coreMeta ? { coreMeta, sourceTopic } : null
  }
  else {
    const coreMeta = parseTvShowCoreMeta(title)

    return coreMeta ? { coreMeta, sourceTopic } : null
  }
}

function removeParentheses(text: string): string {
  return text.replace(/\([^)]*\)/g, '')
}
