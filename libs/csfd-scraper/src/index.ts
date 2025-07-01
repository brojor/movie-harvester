import type { CsfdMovieDetails, CsfdTvShowDetails, MovieRecord, TvShowRecord } from '@repo/types'
import { URLSearchParams } from 'node:url'
import { makeHttpClient } from '@repo/shared'
import * as cheerio from 'cheerio'
import * as htmlParsing from './utils/htmlParsing.js'

const httpClient = makeHttpClient('https://www.csfd.cz')

async function searchCsfdMovie(title: string, year: number): Promise<string> {
  const params = {
    q: `${title} ${year}`,
    series: '0',
    creators: '0',
    users: '0',
  }
  const queryString = new URLSearchParams(params).toString()
  const html = await httpClient.get(`/hledat/?${queryString}`)
  return html
}

async function searchCsfdTvShow(title: string): Promise<string> {
  const params = {
    q: title,
    films: '0',
    creators: '0',
    users: '0',
  }
  const queryString = new URLSearchParams(params).toString()
  const html = await httpClient.get(`/hledat/?${queryString}`)
  return html
}

export async function findCsfdMovieId(movie: MovieRecord): Promise<number> {
  const { czechTitle, originalTitle, year } = movie

  let csfdSlug: string | null = null
  if (czechTitle) {
    const html = await searchCsfdMovie(czechTitle, year)
    csfdSlug = await htmlParsing.findCsfdMovieSlugByCzechTitle(html, czechTitle, year)
  }
  if (!csfdSlug && originalTitle) {
    const html = await searchCsfdMovie(originalTitle, year)
    csfdSlug = await htmlParsing.findCsfdMovieSlugByOriginalTitle(html, originalTitle, year)
  }

  if (!csfdSlug) {
    throw new Error(`ČSFD slug for movie "${czechTitle} / ${originalTitle} (${year})" not found`)
  }

  const csfdId = htmlParsing.getCsfdId(csfdSlug)

  return csfdId
}

export async function findCsfdTvShowId(tvShow: TvShowRecord): Promise<number> {
  const { czechTitle, originalTitle } = tvShow

  let csfdSlug: string | null = null

  if (!csfdSlug && czechTitle) {
    const html = await searchCsfdTvShow(czechTitle)
    csfdSlug = await htmlParsing.findCsfdTvShowSlugByCzechTitle(html, czechTitle)
  }
  if (!csfdSlug && originalTitle) {
    const html = await searchCsfdTvShow(originalTitle)
    csfdSlug = await htmlParsing.findCsfdTvShowSlugByOriginalTitle(html, originalTitle)
  }

  if (!csfdSlug) {
    throw new Error(`ČSFD slug for tv show "${czechTitle} / ${originalTitle}" not found`)
  }

  const csfdId = htmlParsing.getCsfdId(csfdSlug)

  return csfdId
}

export async function getMovieDetails(csfdId: number): Promise<CsfdMovieDetails> {
  const html = await httpClient.get(`/film/${csfdId}/prehled/`)
  const $ = cheerio.load(html)

  return {
    id: csfdId,
    ...htmlParsing.getOrigin($),
    title: htmlParsing.getCzechTitle($),
    voteAverage: htmlParsing.getVoteAverage($),
    voteCount: htmlParsing.getVoteCount($),
    posterPath: htmlParsing.getPosterPath($),
    overview: htmlParsing.getOverview($),
    genres: htmlParsing.getGenres($),
  }
}

export async function getTvShowDetails(csfdId: number): Promise<CsfdTvShowDetails> {
  const html = await httpClient.get(`/film/${csfdId}/prehled/`)
  const $ = cheerio.load(html)

  return {
    id: csfdId,
    title: htmlParsing.getCzechTitle($),
    voteAverage: htmlParsing.getVoteAverage($),
    voteCount: htmlParsing.getVoteCount($),
    posterPath: htmlParsing.getPosterPath($),
    overview: htmlParsing.getOverview($),
    genres: htmlParsing.getGenres($),
  }
}

export * from './utils/htmlParsing.js'
