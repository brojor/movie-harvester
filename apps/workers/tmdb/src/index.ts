import type { MovieRecord, TvShowRecord } from '@repo/database'
import type { MovieSearchResult, TvShowSearchResult } from '@repo/tmdb-fetcher'
import type { MovieTopic, TvShowTopic, WorkerAction, WorkerInputData, WorkerResult } from '@repo/types'
import { createDatabase, MovieRepo, TmdbMovieDataRepo, TmdbTvShowDataRepo, TvShowRepo } from '@repo/database'
import { MediaService } from '@repo/media-service'
import { env } from '@repo/shared'
import { findTmdbMovieId, findTmdbTvShowId, getMovieDetails, getTvShowDetails, searchMovie, searchTvShow } from '@repo/tmdb-fetcher'
import { Worker } from 'bullmq'

const connection = { host: env.REDIS_HOST, port: env.REDIS_PORT, password: env.REDIS_PASSWORD }
const db = createDatabase()

const _movieWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'movies',
  async (job) => {
    switch (job.name) {
      case 'find-id': {
        const movie = job.data as MovieRecord
        const tmdbId = await findTmdbMovieId(movie)
        const movieRepo = new MovieRepo(db)
        await movieRepo.setTmdbId(movie.id, tmdbId)
        return { id: tmdbId }
      }

      case 'get-meta': {
        const { id: tmdbId } = job.data as { id: number }
        const movieDetails = await getMovieDetails(tmdbId)
        const tmdbMovieRepo = new TmdbMovieDataRepo(db)
        await tmdbMovieRepo.save(movieDetails)
        return { id: tmdbId }
      }

      case 'find-movie': {
        const movieTopic = job.data as MovieTopic
        let movieSearchResult: MovieSearchResult | null = null
        for (const title of movieTopic.titles) {
          movieSearchResult = await searchMovie({ title, year: movieTopic.year })
          if (movieSearchResult)
            break
        }

        if (!movieSearchResult)
          throw new Error(`TMDB ID for movie ${movieTopic.id} not found`)

        const mediaService = new MediaService(db)
        const movie = {
          czechTitle: movieSearchResult.title,
          originalTitle: movieSearchResult.original_title,
          year: movieTopic.year,
        }
        const movieId = await mediaService.addMovieWithTopic(movie, movieTopic.id, movieTopic.type, movieSearchResult.id)
        return { id: movieId }
      }

      default:
        throw new Error(`Unknown action: ${job.name}`)
    }
  },
  { connection, prefix: 'rt' },
)

const _tvShowWorker = new Worker<WorkerInputData, WorkerResult, WorkerAction>(
  'tv-show',
  async (job) => {
    switch (job.name) {
      case 'find-id': {
        const tvShow = job.data as TvShowRecord
        const tmdbId = await findTmdbTvShowId(tvShow)
        if (!tmdbId) {
          throw new Error(`TMDB ID for tv show ${tvShow.id} not found`)
        }
        const tvShowRepo = new TvShowRepo(db)
        await tvShowRepo.setTmdbId(tvShow.id, tmdbId)
        return { id: tmdbId }
      }

      case 'get-meta': {
        const { id: tmdbId } = job.data as { id: number }
        const meta = await getTvShowDetails(tmdbId)
        const tmdbTvShowRepo = new TmdbTvShowDataRepo(db)
        await tmdbTvShowRepo.save(meta)
        return { id: tmdbId }
      }

      case 'find-tv-show': {
        const tvShowTopic = job.data as TvShowTopic
        let tvShowSearchResult: TvShowSearchResult | null = null
        for (const title of tvShowTopic.titles) {
          tvShowSearchResult = await searchTvShow({ title })
          if (tvShowSearchResult)
            break
        }

        if (!tvShowSearchResult)
          throw new Error(`TMDB ID for tv show ${tvShowTopic.id} not found`)

        const mediaService = new MediaService(db)
        const tvShow = {
          czechTitle: tvShowSearchResult.name,
          originalTitle: tvShowSearchResult.original_name,
        }
        const tvShowId = await mediaService.addTvShowWithTopic(tvShow, tvShowTopic.languages, tvShowTopic.id, tvShowTopic.type, tvShowSearchResult.id)
        return { id: tvShowId }
      }

      default:
        throw new Error(`Unknown action: ${job.name}`)
    }
  },
  { connection, prefix: 'rt' },
)
