import type { Item, JellyfinResponse } from './types/jellyfin.js'
import type { TMDBMovie, TMDBResponse } from './types/tmdb.js'
import type { AudioStream, WebshareFile, WebshareFileInfoResponse, WebshareResponse } from './types/webshare.js'
import process from 'node:process'
import { XMLParser } from 'fast-xml-parser'
import '@dotenvx/dotenvx/config'

const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_API_KEY = process.env.TMDB_API_KEY
const JELLYFIN_BASE_URL = 'http://192.168.1.5:8096'
const JELLYFIN_API_KEY = process.env.JELLYFIN_API_KEY
const WEBSHARE_BASE_URL = 'https://webshare.cz/api'

async function discoverMovies(page: number = 1): Promise<TMDBResponse> {
  const sortBy = 'popularity.desc'
  const language = 'cs-CZ'
  const genres = [16, 10751]
  const params = new URLSearchParams({
    sort_by: sortBy,
    language,
    with_genres: genres.join(','),
    page: page.toString(),
  })
  const bearerToken = `Bearer ${TMDB_API_KEY}`
  console.log('Fetching page:', page)
  const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${params.toString()}`, {
    headers: {
      Authorization: bearerToken,
    },
  })
  const data = await response.json() as TMDBResponse
  console.log('Found', data.results.length, 'movies on page:', page)
  return data
}

async function getTmdbMovies(): Promise<TMDBMovie[]> {
  const { total_pages } = await discoverMovies()
  const maxPages = Math.min(total_pages)
  console.log('Total pages:', maxPages)
  const movies: TMDBMovie[] = []
  for (let page = 1; page <= maxPages; page++) {
    const { results } = await discoverMovies(page)
    movies.push(...results)
  }
  return movies
}

async function searchOnJellyfin(searchTerm: string): Promise<Item[]> {
  const params = new URLSearchParams({
    Recursive: 'true',
    SearchTerm: searchTerm,
    fields: 'ProviderIds',
  })
  const response = await fetch(`${JELLYFIN_BASE_URL}/Items?${params.toString()}`, {
    headers: {
      'X-Emby-Token': JELLYFIN_API_KEY!,
    },
  })
  const data = await response.json() as JellyfinResponse
  return data.Items ?? []
}

async function searchOnWebshare(searchTerm: string): Promise<WebshareFile[]> {
  const form = new FormData()
  form.append('what', searchTerm)
  form.append('sort', 'largest')

  // IMPORTANT: URL must end with trailing slash, otherwise API won't accept form data
  const response = await fetch(`${WEBSHARE_BASE_URL}/search/`, {
    method: 'POST',
    body: form,
  })
  const data = await response.text()
  const parser = new XMLParser()
  const parsed = parser.parse(data) as { response?: WebshareResponse }
  const webshareResponse = parsed.response
  if (!webshareResponse) {
    console.warn(`Failed to parse webshare search for term: ${searchTerm}. Response:`, data.substring(0, 200))
    return []
  }
  return webshareResponse.file ? webshareResponse.file : []
}

async function getFileInfo(ident: string): Promise<WebshareFileInfoResponse | null> {
  const form = new FormData()
  form.append('ident', ident)
  const fileInfo = await fetch(`${WEBSHARE_BASE_URL}/file_info/`, {
    method: 'POST',
    body: form,
  })
  const fileInfoData = await fileInfo.text()
  const parser = new XMLParser()
  const parsed = parser.parse(fileInfoData) as { response?: WebshareFileInfoResponse }
  const fileInfoResponse = parsed.response
  if (!fileInfoResponse) {
    console.warn(`Failed to parse file info for ident: ${ident}. Response:`, fileInfoData.substring(0, 200))
    return null
  }
  return fileInfoResponse
}

// function formatBytes(bytes: number, decimals = 2, showUnit = true): string {
//   if (bytes === 0)
//     return '0 B'
//   const k = 1024
//   const sizes = ['B', 'KB', 'MB', 'GB']
//   const i = Math.floor(Math.log(bytes) / Math.log(k))
//   return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${showUnit ? sizes[i] : ''}`
// }

function getAudioLanguages(fileInfoResponse: WebshareFileInfoResponse | null): string[] {
  if (!fileInfoResponse) {
    return []
  }
  const langs = new Set<string>()
  if (fileInfoResponse.audio?.stream) {
    const audioStreams = Array.isArray(fileInfoResponse.audio.stream)
      ? fileInfoResponse.audio.stream
      : [fileInfoResponse.audio.stream]
    audioStreams.forEach((stream: AudioStream) => langs.add(stream.language))
  }
  return Array.from(langs)
}

async function main(): Promise<void> {
  console.log('Starting TMDB movies discovery...')
  const movies = await getTmdbMovies()
  console.log('Found', movies.length, 'movies')
  const notOwnedMovies: TMDBMovie[] = []
  for (const movie of movies) {
    const jellyfinItems = await searchOnJellyfin(movie.title)
    const match = jellyfinItems.find((result: any) => result.ProviderIds.Tmdb === movie.id.toString())
    if (!match) {
      console.log('No match found for', movie.title)
      notOwnedMovies.push(movie)
    }
  }
  // 18.28 mm
  for (const movie of notOwnedMovies) {
    if (movie.vote_average < 7.5 || movie.vote_count < 100) {
      continue
    }
    const year = movie.release_date.split('-')[0]
    const sectionTitle = `${movie.title.toUpperCase()} (${year}) ${movie.vote_average * 10}%`
    const searchTerm1 = `${movie.original_title.toLowerCase().replace('the ', '')} ${year}`
    const searchTerm2 = `${movie.title.toLowerCase()} ${year}`
    const webshareFiles1 = await searchOnWebshare(searchTerm1)
    const webshareFiles2 = await searchOnWebshare(searchTerm2)
    const webshareFilesJoined = [...webshareFiles1, ...webshareFiles2]
    const gigabytes = 1024 * 1024 * 1024
    const filtredFiles = webshareFilesJoined.filter(file => file.size > 3 * gigabytes && file.size < 25 * gigabytes)

    const withCzechAudio: WebshareFile[] = []
    for (const file of filtredFiles) {
      const fileInfoResponse = await getFileInfo(file.ident)
      if (!fileInfoResponse) {
        continue
      }
      const langs = getAudioLanguages(fileInfoResponse)
      if (langs.includes('CZE') || file.name.toLowerCase().includes('cz')) {
        withCzechAudio.push(file)
      }
    }
    withCzechAudio.sort((a, b) => b.size - a.size)
    if (!withCzechAudio.length) {
      continue
    }
    const fileName = `${movie.original_title} (${year})`
    const fileUrl = `https://webshare.cz/#/file/${withCzechAudio[0].ident}`
    const movieRating = movie.vote_average
    console.log('='.repeat(sectionTitle.length))
    console.log('\n')
    console.log(`${fileName}: ${fileUrl} - ${movieRating * 10}% (${movie.vote_count} votes)`)
    console.log(sectionTitle)
    // addToQueue(fileName, fileUrl)
  }
}

main()
