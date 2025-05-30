import { URLSearchParams } from 'node:url'
import { db, schema } from '@repo/database'
import { getThrottledClient } from '@repo/shared'
import * as cheerio from 'cheerio'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'

const httpClient = getThrottledClient('https://www.rottentomatoes.com', {
  delayMs: [1000, 5000],
})

async function main(): Promise<void> {
  await fillMissingRtIds()
  await fetchMissingRtData()
}

main()

async function fillMissingRtIds(): Promise<void> {
  const movies = await db.select().from(schema.moviesSource).where(isNull(schema.moviesSource.rtId))
  for (const movie of movies) {
    const slug = await getRTSlug(normalizeTitle(movie.originalTitle), movie.year)
    await db.update(schema.moviesSource).set({ rtId: slug }).where(eq(schema.moviesSource.id, movie.id))
  }
}

async function getRTSlug(title: string, year: number): Promise<string | null> {
  const queryString = new URLSearchParams({ search: title }).toString()
  const html = await httpClient.get(`/search?${queryString}`)

  const $ = cheerio.load(html)
  const url = $('search-page-result[type="movie"] search-page-media-row').filter(function () {
    const parsedTitle = $(this).find('a[data-qa="info-name"]').text().trim()
    const parsedYear = $(this).attr('releaseyear')?.toString().trim()

    console.log(parsedTitle === title && parsedYear === year.toString())

    return parsedTitle === title && parsedYear === year.toString()
  }).find('a[data-qa="info-name"]').attr('href')

  const slug = url?.split('/').filter(Boolean).pop()

  return slug ?? null
}

async function fetchMissingRtData(): Promise<void> {
  const moviesMissingRtData = (
    await db
      .select()
      .from(schema.moviesSource)
      .leftJoin(schema.rtData, eq(schema.rtData.sourceId, schema.moviesSource.id))
      .where(and(isNotNull(schema.moviesSource.rtId), isNull(schema.rtData.id)))
  ).map(m => m.movies_source)

  for (const movie of moviesMissingRtData) {
    const html = await httpClient.get(`/m/${movie.rtId}`)
    const $ = cheerio.load(html)

    const criticsScore = $('media-scorecard rt-text[slot="criticsScore"]').text().trim()
    const audienceScore = $('media-scorecard rt-text[slot="audienceScore"]').text().trim()
    const criticsReviews = $('media-scorecard rt-link[slot="criticsReviews"]').text().trim().replace(/\D/g, '')
    const audienceReviews = $('media-scorecard rt-link[slot="audienceReviews"]').text().trim().replace(/\D/g, '')

    await db.insert(schema.rtData).values({
      sourceId: movie.id,
      criticsScore: parseNullableInt(criticsScore),
      audienceScore: parseNullableInt(audienceScore),
      criticsReviews: parseNullableInt(criticsReviews),
      audienceReviews: parseNullableInt(audienceReviews),
    })
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
