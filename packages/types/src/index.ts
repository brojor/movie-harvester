import type { moviesSchema, tvShowsSchema } from '@repo/database'

export type MovieSource = typeof moviesSchema.movieSources.$inferSelect
export type TvShowSource = typeof tvShowsSchema.tvShowSources.$inferSelect
export type CsfdMovieData = typeof moviesSchema.csfdMovieData.$inferSelect
export type CsfdTvShowData = typeof tvShowsSchema.csfdTvShowData.$inferSelect

export type TmdbNetwork = typeof tvShowsSchema.tmdbNetworks.$inferSelect
export type TmdbSeason = typeof tvShowsSchema.tmdbSeasons.$inferSelect

export type DataTable
  = | typeof moviesSchema.tmdbMovieData
    | typeof tvShowsSchema.tmdbTvShowsData
    | typeof moviesSchema.csfdMovieData
    | typeof tvShowsSchema.csfdTvShowData
    | typeof moviesSchema.rtMovieData
    | typeof tvShowsSchema.rtTvShowData

export type SourceTable = typeof moviesSchema.movieSources | typeof tvShowsSchema.tvShowSources
