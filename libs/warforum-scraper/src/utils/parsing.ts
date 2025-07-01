import type { MediaType, MovieCoreMeta, TvShowCoreMeta } from '@repo/types'

export function extractTopicId(url: string): number | null {
  const match = url.match(/t=(\d+)/)
  if (!match) {
    console.error(`Invalid topic URL: "${url}"`)
    return null
  }
  return Number.parseInt(match[1], 10)
}

export function parseMovieCoreMeta(topicTitle: string): MovieCoreMeta | null {
  const regex = /^([^()]+)\((\d{4})\)$/
  const match = topicTitle.match(regex)
  if (!match) {
    console.error(`Invalid topic title: "${topicTitle}"`)
    return null
  }

  const titlePart = match[1].trim()
  const titles = titlePart.split(/\s*\/\s*/).filter(Boolean)
  const year = Number.parseInt(match[2], 10)

  return { titles, year }
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

export function parseTvShowCoreMeta(topicTitle: string): TvShowCoreMeta | null {
  const parts = removeParentheses(topicTitle).split('/').map(part => part.trim())

  const languages = parts.pop()?.split(',').map(lang => lang.trim()) || []

  if (!languages.length || !parts.length) {
    console.error(`Invalid topic title: "${topicTitle}"`)
    return null
  }

  return {
    titles: parts,
    languages,
  }
}

export function parseMediaItem(
  title: string,
  mediaType: MediaType,
): MovieCoreMeta | TvShowCoreMeta | null {
  if (mediaType === 'movie') {
    return parseMovieCoreMeta(title)
  }
  else {
    return parseTvShowCoreMeta(title)
  }
}

function removeParentheses(text: string): string {
  return text.replace(/\([^)]*\)/g, '')
}
