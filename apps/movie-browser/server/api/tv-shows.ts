import type { TvShowNetwork, TvShowSeason } from '@repo/types'
import type { SearchParams } from '../../types'
import { db, tvShowsSchema } from '@repo/database'
import { asc, desc, eq } from 'drizzle-orm'

const { tvShowSources, tmdbTvShowsData, tmdbTvShowToGenres, tmdbTvShowGenres, networks, tvShowNetworks, seasons } = tvShowsSchema

const sortByToColumn = {
  title: tmdbTvShowsData.name,
  year: tmdbTvShowsData.firstAirDate,
  rating: tmdbTvShowsData.voteAverage,
  releaseDate: tmdbTvShowsData.firstAirDate,
}

export default defineEventHandler(async (event) => {
  const { sortBy, order } = getQuery(event) as SearchParams

  // 1. Základní dotaz
  const tvShows = await db
    .select({
      tvShow: tvShowSources,
      tmdb: tmdbTvShowsData,
    })
    .from(tvShowSources)
    .innerJoin(tmdbTvShowsData, eq(tvShowSources.id, tmdbTvShowsData.sourceId))
    .orderBy((order === 'desc' ? desc : asc)(
      sortByToColumn[sortBy],
    ))

  // 2. Načtení TMDB žánrů
  const tmdbGenresMap = new Map<number, string[]>()

  const tmdbGenresJoin = await db
    .select({
      tvShowId: tmdbTvShowToGenres.tvShowId,
      genre: tmdbTvShowGenres.name,
    })
    .from(tmdbTvShowToGenres)
    .innerJoin(tmdbTvShowGenres, eq(tmdbTvShowToGenres.genreId, tmdbTvShowGenres.id))

  for (const { tvShowId, genre } of tmdbGenresJoin) {
    if (tvShowId !== null) {
      if (!tmdbGenresMap.has(tvShowId)) {
        tmdbGenresMap.set(tvShowId, [])
      }
      tmdbGenresMap.get(tvShowId)!.push(genre)
    }
  }

  // 3. Načtení networks
  const networksMap = new Map<number, TvShowNetwork[]>()

  const networksJoin = await db
    .select({
      tvShowId: tvShowNetworks.tvShowId,
      network: networks,
    })
    .from(tvShowNetworks)
    .innerJoin(networks, eq(tvShowNetworks.networkId, networks.id))

  for (const { tvShowId, network } of networksJoin) {
    if (tvShowId !== null) {
      if (!networksMap.has(tvShowId)) {
        networksMap.set(tvShowId, [])
      }
      networksMap.get(tvShowId)!.push(network)
    }
  }

  // 4. Načtení seasons
  const seasonsMap = new Map<number, TvShowSeason[]>()

  const seasonsData = await db
    .select()
    .from(seasons)

  for (const season of seasonsData) {
    if (season.tvShowId !== null) {
      if (!seasonsMap.has(season.tvShowId)) {
        seasonsMap.set(season.tvShowId, [])
      }
      seasonsMap.get(season.tvShowId)!.push(season)
    }
  }

  // 5. Složení finálního výsledku
  const enriched = tvShows.map(item => ({
    ...item,
    tmdbGenres: item.tmdb?.id ? tmdbGenresMap.get(item.tmdb.id) ?? [] : [],
    networks: item.tmdb?.id ? networksMap.get(item.tmdb.id) ?? [] : [],
    seasons: item.tmdb?.id ? seasonsMap.get(item.tmdb.id) ?? [] : [],
  }))

  return enriched
})
