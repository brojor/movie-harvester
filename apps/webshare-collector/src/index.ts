import type { Item, JellyfinResponse } from './types/jellyfin.js'
import type { TMDBMovie, TMDBResponse } from './types/tmdb.js'
import type { AudioStream, WebshareFile, WebshareFileInfoResponse, WebshareResponse } from './types/webshare.js'
import process from 'node:process'
import { XMLParser } from 'fast-xml-parser'
import { addToQueue } from './queue.js'
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
  const response = await fetch(`${TMDB_BASE_URL}/discover/movie?${params.toString()}`, {
    headers: {
      Authorization: bearerToken,
    },
  })
  const data = await response.json() as TMDBResponse
  return data
}

async function getTmdbMovies(): Promise<TMDBMovie[]> {
  const { total_pages } = await discoverMovies()
  const maxPages = 3
  const movies: TMDBMovie[] = []
  for (let page = 1; page <= Math.min(maxPages, total_pages); page++) {
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
  const { response: webshareResponse } = parser.parse(data) as { response: WebshareResponse }
  return webshareResponse.file ? webshareResponse.file : []
}

async function getFileInfo(ident: string): Promise<WebshareFileInfoResponse> {
  const form = new FormData()
  form.append('ident', ident)
  const fileInfo = await fetch(`${WEBSHARE_BASE_URL}/file_info/`, {
    method: 'POST',
    body: form,
  })
  const fileInfoData = await fileInfo.text()
  const parser = new XMLParser()
  const { response: fileInfoResponse } = parser.parse(fileInfoData) as { response: WebshareFileInfoResponse }
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

function getAudioLanguages(fileInfoResponse: WebshareFileInfoResponse): string[] {
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
  const movies = await getTmdbMovies()
  const notOwnedMovies: TMDBMovie[] = []
  for (const movie of movies) {
    const jellyfinItems = await searchOnJellyfin(movie.title)
    const match = jellyfinItems.find((result: any) => result.ProviderIds.Tmdb === movie.id.toString())
    if (!match) {
      notOwnedMovies.push(movie)
    }
  }

  for (const movie of notOwnedMovies) {
    const year = movie.release_date.split('-')[0]
    const sectionTitle = `${movie.title.toUpperCase()} (${year})`
    console.log(sectionTitle)
    console.log('='.repeat(sectionTitle.length))
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
    addToQueue(fileName, fileUrl)
  }
}

main()
