import type { CsfdMovieData, MovieSource, TvShowSource } from 'packages/types/dist/index.js'
import type { MovieDetailsResponse, TvShowDetailsResponse } from '../types.js'
import { db, getLastProcessedDate, moviesSchema, tvShowsSchema } from '@repo/database'
import { and, eq, gt, isNull } from 'drizzle-orm'
import genres from '../movie-genres.json' with { type: 'json' }
import tvShowGenres from '../tv-show-genres.json' with { type: 'json' }

export async function getLastTmdbMovieProcessedDate(): Promise<Date> {
  return getLastProcessedDate(moviesSchema.tmdbMovieData)
}

export async function getLastTmdbTvShowProcessedDate(): Promise<Date> {
  return getLastProcessedDate(tvShowsSchema.tmdbTvShowsData)
}

export async function getUnprocessedMovies(cutoffDate: Date): Promise<MovieSource[]> {
  const res = await db
    .select()
    .from(moviesSchema.movieSources)
    .leftJoin(
      moviesSchema.tmdbMovieData,
      eq(moviesSchema.movieSources.id, moviesSchema.tmdbMovieData.sourceId),
    )
    .where(
      and(
        isNull(moviesSchema.tmdbMovieData.id),
        gt(moviesSchema.movieSources.createdAt, cutoffDate),
      ),
    )

  return res.map(m => m.movie_sources)
}

export async function getUnprocessedTvShows(cutoffDate: Date): Promise<TvShowSource[]> {
  const res = await db
    .select()
    .from(tvShowsSchema.tvShowSources)
    .leftJoin(
      tvShowsSchema.tmdbTvShowsData,
      eq(tvShowsSchema.tvShowSources.id, tvShowsSchema.tmdbTvShowsData.sourceId),
    )
    .where(
      and(
        isNull(tvShowsSchema.tmdbTvShowsData.id),
        gt(tvShowsSchema.tvShowSources.createdAt, cutoffDate),
      ),
    )

  return res.map(m => m.tv_show_sources)
}

export async function getCsfdMovieData(sourceId: number): Promise<CsfdMovieData | null> {
  const res = await db
    .select()
    .from(moviesSchema.csfdMovieData)
    .where(eq(moviesSchema.csfdMovieData.sourceId, sourceId))
    .limit(1)

  return res?.[0] ?? null
}

export async function saveTmdbMovieData(movieDetails: MovieDetailsResponse, sourceId: number): Promise<void> {
  await db.insert(moviesSchema.tmdbMovieData).values({
    id: movieDetails.id,
    sourceId,
    imdbId: movieDetails.imdb_id,
    title: movieDetails.title,
    originalTitle: movieDetails.original_title,
    originalLanguage: movieDetails.original_language,
    originCountry: JSON.stringify(movieDetails.origin_country),
    posterPath: movieDetails.poster_path,
    backdropPath: movieDetails.backdrop_path,
    releaseDate: movieDetails.release_date,
    runtime: movieDetails.runtime,
    voteAverage: movieDetails.vote_average,
    voteCount: movieDetails.vote_count,
    tagline: movieDetails.tagline,
    overview: movieDetails.overview,
  }).onConflictDoNothing()

  await db.insert(moviesSchema.tmdbMoviesToGenres).values(
    movieDetails.genres.map(genre => ({
      movieId: movieDetails.id,
      genreId: genre.id,
    })),
  ).onConflictDoNothing()
}

export async function saveTmdbTvShowData(tvShowDetails: TvShowDetailsResponse, sourceId: number): Promise<void> {
  await db.insert(tvShowsSchema.tmdbTvShowsData).values({
    id: tvShowDetails.id,
    sourceId,
    name: tvShowDetails.name,
    originalName: tvShowDetails.original_name,
    originalLanguage: tvShowDetails.original_language,
    overview: tvShowDetails.overview,
    posterPath: tvShowDetails.poster_path,
    backdropPath: tvShowDetails.backdrop_path,
    firstAirDate: tvShowDetails.first_air_date,
    episodeRunTime: JSON.stringify(tvShowDetails.episode_run_time),
    numberOfEpisodes: tvShowDetails.number_of_episodes,
    numberOfSeasons: tvShowDetails.number_of_seasons,
    originCountry: JSON.stringify(tvShowDetails.origin_country),
    languages: JSON.stringify(tvShowDetails.languages),
    type: tvShowDetails.type,
    popularity: tvShowDetails.popularity,
    voteAverage: tvShowDetails.vote_average,
    voteCount: tvShowDetails.vote_count,
  }).onConflictDoNothing()

  await db.insert(tvShowsSchema.tmdbTvShowsToGenres).values(
    tvShowDetails.genres.map(genre => ({
      tvShowId: tvShowDetails.id,
      genreId: genre.id,
    })),
  ).onConflictDoNothing()

  for (const network of tvShowDetails.networks) {
    await db.insert(tvShowsSchema.tmdbNetworks).values({
      id: network.id,
      name: network.name,
      logoPath: network.logo_path,
      originCountry: network.origin_country,
    }).onConflictDoNothing()

    await db.insert(tvShowsSchema.tmdbTvShowToNetworks).values({
      tvShowId: tvShowDetails.id,
      networkId: network.id,
    }).onConflictDoNothing()
  }

  await db.insert(tvShowsSchema.tmdbSeasons).values(
    tvShowDetails.seasons.map(season => ({
      id: season.id,
      tvShowId: tvShowDetails.id,
      name: season.name,
      overview: season.overview,
      posterPath: season.poster_path,
      seasonNumber: season.season_number,
      voteAverage: season.vote_average,
      episodeCount: season.episode_count,
      airDate: season.air_date,
    })),
  ).onConflictDoNothing()
}

export async function seedTmdbMovieGenres(): Promise<void> {
  await db.insert(moviesSchema.tmdbMovieGenres).values(genres).onConflictDoNothing()
}

export async function seedTmdbTvShowGenres(): Promise<void> {
  await db.insert(tvShowsSchema.tmdbTvShowGenres).values(tvShowGenres).onConflictDoNothing()
}
