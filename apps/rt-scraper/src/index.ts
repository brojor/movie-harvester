import { URLSearchParams } from 'node:url'
import { db, moviesSchema } from '@repo/database'
import { getThrottledClient } from '@repo/shared'
import * as cheerio from 'cheerio'
import { and, desc, eq, gt, isNull } from 'drizzle-orm'

interface RtData {
  criticsScore: number | null
  audienceScore: number | null
  criticsReviews: number | null
  audienceReviews: number | null
  rtId: string
}

const httpClient = getThrottledClient('https://www.rottentomatoes.com', {
  delayMs: [1000, 5000],
})

export async function populateRtData(): Promise<void> {
  const lastRecordDate = (await db.select().from(moviesSchema.rtMovieData).orderBy(desc(moviesSchema.rtMovieData.createdAt)).limit(1))?.[0]?.createdAt || new Date(0)
  const res = await db.select().from(moviesSchema.movieSources).leftJoin(moviesSchema.rtMovieData, eq(moviesSchema.movieSources.id, moviesSchema.rtMovieData.sourceId)).where(and(isNull(moviesSchema.rtMovieData.id), gt(moviesSchema.movieSources.createdAt, lastRecordDate)))
  const movies = res.map(m => m.movie_sources)
  for (const movie of movies) {
    let rtId

    if (movie.originalTitle) {
      rtId = await getRtId(normalizeTitle(movie.originalTitle), movie.year)
    }

    if (!rtId) {
      const csfdRow = (await db.select().from(moviesSchema.csfdMovieData).where(eq(moviesSchema.csfdMovieData.sourceId, movie.id)).limit(1))[0]
      if (!csfdRow || !csfdRow.originalTitle) {
        console.error(`Movie ${movie.originalTitle} (${movie.year}) not found`)
        continue
      }
      rtId = await getRtId(normalizeTitle(csfdRow.originalTitle), movie.year)
      if (!rtId) {
        console.error(`Movie ${movie.originalTitle} (${movie.year}) not found`)
        continue
      }
    }
    const rtData = await fetchRtData(rtId)
    await db.insert(moviesSchema.rtMovieData).values({
      sourceId: movie.id,
      ...rtData,
    })
  }
}

async function getRtId(title: string, year: number): Promise<string | null> {
  const queryString = new URLSearchParams({ search: title }).toString()
  const html = await httpClient.get(`/search?${queryString}`)

  const $ = cheerio.load(html)
  const url = $('search-page-result[type="movie"] search-page-media-row').filter(function () {
    const parsedTitle = $(this).find('a[data-qa="info-name"]').text().trim()
    const parsedYear = $(this).attr('releaseyear')?.toString().trim()

    return parsedTitle === title && parsedYear === year.toString()
  }).find('a[data-qa="info-name"]').attr('href')

  const id = url?.split('/').filter(Boolean).pop()

  return id ?? null
}

async function fetchRtData(rtId: string): Promise<RtData> {
  const html = await httpClient.get(`/m/${rtId}`)
  const $ = cheerio.load(html)

  const criticsScore = $('media-scorecard rt-text[slot="criticsScore"]').text().trim()
  const audienceScore = $('media-scorecard rt-text[slot="audienceScore"]').text().trim()
  const criticsReviews = $('media-scorecard rt-link[slot="criticsReviews"]').text().trim().replace(/\D/g, '')
  const audienceReviews = $('media-scorecard rt-link[slot="audienceReviews"]').text().trim().replace(/\D/g, '')

  return {
    criticsScore: parseNullableInt(criticsScore),
    audienceScore: parseNullableInt(audienceScore),
    criticsReviews: parseNullableInt(criticsReviews),
    audienceReviews: parseNullableInt(audienceReviews),
    rtId,
  }
}

function normalizeTitle(input: string): string {
  if (input.endsWith(', The')) {
    return `The ${input.slice(0, -5)}`
  }
  return input
}

function parseNullableInt(value: string): number | null {
  const parsed = Number.parseInt(value)
  return Number.isNaN(parsed) ? null : parsed
}
