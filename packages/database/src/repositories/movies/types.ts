import type { CsfdMovieDetails } from '@repo/csfd-scraper'
import type { Movie, TopicType } from '@repo/types'

export interface MovieRepository {
  addMovie: (movie: Movie) => Promise<number>
  setCsfdId: (movieId: number, csfdId: number) => Promise<void>
  setTmdbId: (movieId: number, tmdbId: number) => Promise<void>
  setRtId: (movieId: number, rtId: number) => Promise<void>
}

export interface MovieTopicsRepository {
  setMovieTopicSource: (movieId: number, topicId: number, sourceType: TopicType) => Promise<void>
}

export interface CsfdMovieDataRepository {
  save: (movieDetails: CsfdMovieDetails) => Promise<number>
}
