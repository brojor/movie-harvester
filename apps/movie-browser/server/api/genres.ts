import { createDatabase, moviesSchema, tvShowsSchema } from '@repo/database'

const db = createDatabase(useRuntimeConfig().dbUrl)

const { tmdbMovieGenres } = moviesSchema
const { tmdbTvShowGenres } = tvShowsSchema

interface Genre {
  id: number
  name: string
}

type MediaType = 'movie' | 'tv-show'

function validateMediaType(type: unknown): type is MediaType {
  return type === 'movie' || type === 'tv-show'
}

async function getMovieGenres(): Promise<Genre[]> {
  return await db
    .select({
      id: tmdbMovieGenres.id,
      name: tmdbMovieGenres.name,
    })
    .from(tmdbMovieGenres)
    .orderBy(tmdbMovieGenres.name)
}

async function getTvShowGenres(): Promise<Genre[]> {
  return await db
    .select({
      id: tmdbTvShowGenres.id,
      name: tmdbTvShowGenres.name,
    })
    .from(tmdbTvShowGenres)
    .orderBy(tmdbTvShowGenres.name)
}

export default defineEventHandler(async (event) => {
  const { type } = getQuery(event) as { type?: unknown }

  if (!type || !validateMediaType(type)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Type parameter is required. Use type=movie or type=tv-show',
    })
  }

  try {
    return type === 'movie' ? await getMovieGenres() : await getTvShowGenres()
  }
  catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch genres',
    })
  }
})
