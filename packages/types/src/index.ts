import type { moviesSchema, tvShowsSchema } from '@repo/database'

export type MovieSource = typeof moviesSchema.movieSources.$inferSelect
export type TvShowSource = typeof tvShowsSchema.tvShowSources.$inferSelect

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

export type UnprocessedTmdbMovies = { movie_sources: MovieSource, tmdb_movie_data?: TmdbMovieData | null }[]
export type UnprocessedCsfdMovies = { movie_sources: MovieSource, csfd_movie_data?: CsfdMovieData | null }[]
export type UnprocessedRtMovies = { movie_sources: MovieSource, rt_movie_data?: RtMovieData | null }[]
export type UnprocessedTmdbTvShows = { tv_show_sources: TvShowSource, tmdb_tv_show_data?: TmdbTvShowData | null }[]
export type UnprocessedCsfdTvShows = { tv_show_sources: TvShowSource, csfd_tv_show_data?: CsfdTvShowData | null }[]
export type UnprocessedRtTvShows = { tv_show_sources: TvShowSource, rt_tv_show_data?: RtTvShowData | null }[]

export type MediaTable = TmdbMovieTable | CsfdMovieTable | RtMovieTable | TmdbTvShowTable | CsfdTvShowTable | RtTvShowTable
export type UnprocessedSources = UnprocessedTmdbMovies | UnprocessedCsfdMovies | UnprocessedRtMovies | UnprocessedTmdbTvShows | UnprocessedCsfdTvShows | UnprocessedRtTvShows

export type SourceTable = typeof moviesSchema.movieSources | typeof tvShowsSchema.tvShowSources
