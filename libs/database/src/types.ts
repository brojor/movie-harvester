import type * as movieRepos from './repositories/movies/index.js'
import type * as tvShowRepos from './repositories/tv-shows/index.js'
import type * as moviesSchema from './schemas/movies.js'
import type * as tvShowsSchema from './schemas/tv-shows.js'

// Export types derived from schemas
export type MovieRecord = typeof moviesSchema.movies.$inferSelect
export type TvShowRecord = typeof tvShowsSchema.tvShows.$inferSelect

export type CsfdMovieData = typeof moviesSchema.csfdMovieData.$inferSelect
export type TmdbMovieData = typeof moviesSchema.tmdbMovieData.$inferSelect
export type RtMovieData = typeof moviesSchema.rtMovieData.$inferSelect

export type CsfdTvShowData = typeof tvShowsSchema.csfdTvShowData.$inferSelect
export type TmdbTvShowData = typeof tvShowsSchema.tmdbTvShowsData.$inferSelect
export type RtTvShowData = typeof tvShowsSchema.rtTvShowData.$inferSelect

export type TmdbNetwork = typeof tvShowsSchema.tmdbNetworks.$inferSelect
export type TmdbSeason = typeof tvShowsSchema.tmdbSeasons.$inferSelect

export type TmdbMovieTable = typeof moviesSchema.tmdbMovieData
export type TmdbTvShowTable = typeof tvShowsSchema.tmdbTvShowsData
export type CsfdMovieTable = typeof moviesSchema.csfdMovieData
export type CsfdTvShowTable = typeof tvShowsSchema.csfdTvShowData
export type RtMovieTable = typeof moviesSchema.rtMovieData
export type RtTvShowTable = typeof tvShowsSchema.rtTvShowData

export type UnprocessedTmdbMovies = { movie_sources: MovieRecord, tmdb_movie_data?: TmdbMovieData | null }[]
export type UnprocessedCsfdMovies = { movie_sources: MovieRecord, csfd_movie_data?: CsfdMovieData | null }[]
export type UnprocessedRtMovies = { movie_sources: MovieRecord, rt_movie_data?: RtMovieData | null }[]
export type UnprocessedTmdbTvShows = { tv_show_sources: TvShowRecord, tmdb_tv_show_data?: TmdbTvShowData | null }[]
export type UnprocessedCsfdTvShows = { tv_show_sources: TvShowRecord, csfd_tv_show_data?: CsfdTvShowData | null }[]
export type UnprocessedRtTvShows = { tv_show_sources: TvShowRecord, rt_tv_show_data?: RtTvShowData | null }[]

export type MediaTable = TmdbMovieTable | CsfdMovieTable | RtMovieTable | TmdbTvShowTable | CsfdTvShowTable | RtTvShowTable
export type UnprocessedSources = UnprocessedTmdbMovies | UnprocessedCsfdMovies | UnprocessedRtMovies | UnprocessedTmdbTvShows | UnprocessedCsfdTvShows | UnprocessedRtTvShows

export type SourceTable = typeof moviesSchema.movies | typeof tvShowsSchema.tvShows

export type { Database } from './connection.js'

export interface MovieRepositories {
  movieRepo: movieRepos.MovieRepo
  movieTopicsRepo: movieRepos.MovieTopicsRepo
  csfdMovieDataRepo: movieRepos.CsfdMovieDataRepo
  rtMovieDataRepo: movieRepos.RtMovieDataRepo
  tmdbMovieDataRepo: movieRepos.TmdbMovieDataRepo
}

export interface TvShowRepositories {
  tvShowRepo: tvShowRepos.TvShowRepo
  tvShowTopicsRepo: tvShowRepos.TvShowTopicsRepo
  csfdTvShowDataRepo: tvShowRepos.CsfdTvShowDataRepo
  rtTvShowDataRepo: tvShowRepos.RtTvShowDataRepo
  tmdbTvShowDataRepo: tvShowRepos.TmdbTvShowDataRepo
}

export type AllRepositories = MovieRepositories & TvShowRepositories

export type MovieTopic = typeof moviesSchema.movieTopics.$inferSelect
export type TvShowTopic = typeof tvShowsSchema.tvShowTopics.$inferSelect
