import type { RtDetails } from '@repo/rt-scraper'
import type { TmdbMovieDetails } from '@repo/tmdb-fetcher'
import type { CsfdMovieDetails, Movie, TopicType } from '@repo/types'
import type { MovieRecord } from '../../types.js'

export interface MovieRepository {
  firstOrCreate: (movie: Movie) => Promise<MovieRecord>
  setCsfdId: (movieId: number, csfdId: number) => Promise<void>
  setTmdbId: (movieId: number, tmdbId: number) => Promise<void>
  setRtId: (movieId: number, rtId: string) => Promise<void>
}

export interface MovieTopicsRepository {
  setMovieTopicSource: (movieId: number, topicId: number, sourceType: TopicType) => Promise<void>
}

export interface CsfdMovieDataRepository {
  save: (movieDetails: CsfdMovieDetails) => Promise<number>
}

export interface RtMovieDataRepository {
  save: (movieDetails: RtDetails) => Promise<string>
}

export interface TmdbMovieDataRepository {
  save: (movieDetails: TmdbMovieDetails) => Promise<number>
}
