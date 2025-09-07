// Factory functions for creating repository instances
import type { AllRepositories, Database, MovieRepositories, TvShowRepositories } from './types.js'
import * as movieRepos from './repositories/movies/index.js'
import * as tvShowRepos from './repositories/tv-shows/index.js'

export * from './connection.js'

export * from './repositories/movies/index.js'
export * from './repositories/tv-shows/index.js'
export * as commonSchema from './schemas/common.js'
export * as moviesSchema from './schemas/movies.js'
export * as tvShowsSchema from './schemas/tv-shows.js'

export * from './types.js'

export function createMovieRepositories(db: Database): MovieRepositories {
  return {
    movieRepo: new movieRepos.MovieRepo(db),
    movieTopicsRepo: new movieRepos.MovieTopicsRepo(db),
    csfdMovieDataRepo: new movieRepos.CsfdMovieDataRepo(db),
    rtMovieDataRepo: new movieRepos.RtMovieDataRepo(db),
    tmdbMovieDataRepo: new movieRepos.TmdbMovieDataRepo(db),
  }
}

export function createTvShowRepositories(db: Database): TvShowRepositories {
  return {
    tvShowRepo: new tvShowRepos.TvShowRepo(db),
    tvShowTopicsRepo: new tvShowRepos.TvShowTopicsRepo(db),
    csfdTvShowDataRepo: new tvShowRepos.CsfdTvShowDataRepo(db),
    rtTvShowDataRepo: new tvShowRepos.RtTvShowDataRepo(db),
    tmdbTvShowDataRepo: new tvShowRepos.TmdbTvShowDataRepo(db),
  }
}

export function createAllRepositories(db: Database): AllRepositories {
  return {
    ...createMovieRepositories(db),
    ...createTvShowRepositories(db),
  }
}
