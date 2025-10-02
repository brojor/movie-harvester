// Import all types from database
import type {
  CsfdMovieData,
  MovieRecord,
  MovieTopic,
  RtMovieData,
  TmdbMovieData,
} from '@repo/database'

// UI-specific types
export const SORT_BY_OPTIONS = [
  { label: 'Název', value: 'title' },
  { label: 'Hodnocení', value: 'rating' },
  { label: 'Datum vydání', value: 'releaseDate' },
  { label: 'Datum přidání', value: 'addedDate' },
] as const

export const RATING_SOURCE_OPTIONS = [
  { label: 'ČSFD', value: 'csfd' },
  { label: 'TMDB', value: 'tmdb' },
  { label: 'Rotten Tomatoes', value: 'rt' },
] as const

export const MEDIA_TYPE_OPTIONS = [
  { label: 'Film', value: 'movie' },
  { label: 'Seriál', value: 'tv-show' },
] as const

export const ORDER_OPTIONS = ['asc', 'desc'] as const

type ValueOf<T extends readonly { value: any }[]> = T[number]['value']

export interface SearchParams {
  sortBy: ValueOf<typeof SORT_BY_OPTIONS>
  ratingSource: ValueOf<typeof RATING_SOURCE_OPTIONS>
  order: typeof ORDER_OPTIONS[number]
  genreId?: number
  page?: number
  limit?: number
}

export type MediaType = ValueOf<typeof MEDIA_TYPE_OPTIONS>

export interface Genre {
  id: number
  name: string
}

export interface PageCache<T> {
  value: Ref<T | null>
  loadPage: (page: number, opts?: { activate?: boolean }) => Promise<void>
  peekPage: (page: number) => Ref<T | null>
}

// Genre type for relations
export interface GenreWithRelation { genre: { id: number, name: string } }

// Complete movie type with relations (as returned by API)
export type Movie = MovieRecord & {
  tmdbData: (TmdbMovieData & {
    genres: Array<GenreWithRelation>
  }) | null
  csfdData: (CsfdMovieData & {
    genres: Array<GenreWithRelation>
  }) | null
  rtData: RtMovieData | null
  topics: MovieTopic[]
}
