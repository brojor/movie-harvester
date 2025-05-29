import { URLSearchParams } from 'node:url'
import { db, schema } from '@repo/database'
import { getThrottledClient } from '@repo/shared'
import * as cheerio from 'cheerio'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'

const httpClient = getThrottledClient('https://www.csfd.cz', {
  delayMs: [1000, 5000],
})

async function main(): Promise<void> {
  await fillMissingCsfdIds()
  await fetchMissingCsfdData()
}

main()

async function fillMissingCsfdIds(): Promise<void> {
  const movies = await db.select().from(schema.moviesSource).where(isNull(schema.moviesSource.csfdId))
  for (const movie of movies) {
    const slug = await getCSFDSlug(movie.czechTitle, movie.year)
    if (slug) {
      await db.update(schema.moviesSource).set({ csfdId: slug }).where(eq(schema.moviesSource.id, movie.id))
    }
  }
}

async function getCSFDSlug(title: string, year: number): Promise<string | null> {
  const params = {
    q: `${title} ${year}`,
    series: '0',
    creators: '0',
    users: '0',
  }
  const queryString = new URLSearchParams(params).toString()
  const html = await httpClient.get(`/hledat/?${queryString}`)

  const $ = cheerio.load(html)
  const url = $('#snippet--containerFilms .film-title-nooverflow').filter(function () {
    const text = $(this).text().trim()
    const searchText = `${title} (${year})`
    return text.toLocaleLowerCase() === searchText.toLocaleLowerCase()
  }).find('a').attr('href')

  if (!url) {
    console.error(`Movie ${title} ${year} not found`)
    return null
  }

  const parts = url.split('/').filter(Boolean)
  return parts[parts.length - 1]
}

async function fetchMissingCsfdData(): Promise<void> {
  const moviesMissingCsfdData = (
    await db
      .select()
      .from(schema.moviesSource)
      .leftJoin(schema.csfdData, eq(schema.csfdData.sourceId, schema.moviesSource.id))
      .where(and(isNotNull(schema.moviesSource.csfdId), isNull(schema.csfdData.id)))
  ).map(m => m.movies_source)

  for (const movie of moviesMissingCsfdData) {
    const html = await httpClient.get(`/film/${movie.csfdId}/prehled/`)
    const $ = cheerio.load(html)

    const title = $('h1').text().trim()
    const originalTitle = $('ul.film-names').children().first().contents().filter(function () {
      return this.type === 'text'
    }).text().trim()
    const origin = $('.film-info .origin').text().trim()
    const [_country, releaseYear, runtimeString] = origin.split(', ').map(part => part.trim())
    const runtime = Number.parseInt(runtimeString.replace('min', ''))
    const voteAverage = Number.parseInt($('.film-info .film-rating-average').text().trim().replace(/\D/g, '')) || 0
    const voteCount = Number.parseInt($('li.ratings-btn span.counter').text().trim().replace('(', '').replace(/\D/g, '')) || 0

    const posterSrcSet = $('.film-posters').find('img').attr('srcset') ?? ''
    const sources = posterSrcSet.split(',').map(src => src.trim())
    const highestRes = sources[sources.length - 1]
    const posterPath = highestRes.split(' ')[0].split('/').slice(-3).join('/')
    const overview = $('.plot-full p').find('em').remove().end().text().trim()

    await db.insert(schema.csfdData).values({
      sourceId: movie.id,
      title,
      originalTitle,
      releaseYear: Number.parseInt(releaseYear),
      runtime,
      voteAverage,
      voteCount,
      posterPath,
      overview,
    })
  }
}
