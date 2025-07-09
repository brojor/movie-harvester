import type { CsfdGenre } from '@repo/types'
import type { CheerioAPI } from 'cheerio'
import * as cheerio from 'cheerio'

interface Origin {
  originalTitle: string
  releaseYear: number
  runtime: number | null
}

export function getCzechTitle($: CheerioAPI): string {
  return $('h1').text().trim()
}

export function getOrigin($: CheerioAPI): Origin {
  const origin = $('.film-info .origin').text().trim()
  const [countries, releaseYear, runtimeString] = origin.split(', ').map(part => part.trim())
  const originalTitle = getOriginalTitle($, countries)
  return {
    originalTitle,
    releaseYear: Number.parseInt(releaseYear),
    runtime: Number.parseInt(runtimeString) || null,
  }
}

export function getVoteAverage($: CheerioAPI): number | null {
  return Number.parseInt($('.film-info .film-rating-average').text()) || null
}

export function getVoteCount($: CheerioAPI): number | null {
  return Number.parseInt($('li.ratings-btn span.counter').text().replace(/\D/g, '')) || null
}

export function getPosterPath($: CheerioAPI): string | null {
  const posterSrcSet = $('.film-posters').find('img').attr('srcset')
  if (!posterSrcSet) {
    return null
  }
  const sources = posterSrcSet.split(',').map(src => src.trim())
  const highestRes = sources[sources.length - 1]
  return highestRes.split(' ')[0].split('/').slice(-3).join('/')
}

export function getOverview($: CheerioAPI): string | null {
  return $('.plot-full p').find('em').remove().end().text().trim() || null
}

export function getGenres($: CheerioAPI): CsfdGenre[] {
  return $('.genres a').map((_, el) => {
    const name = $(el).text().trim()

    if (!name) {
      throw new Error(`Element ${el.toString()} has no valid name`)
    }

    const idSlug = $(el).attr('href')?.split('/').filter(Boolean).pop()

    if (!idSlug) {
      throw new Error(`Element ${el.toString()} has no valid id slug`)
    }

    const id = Number.parseInt(idSlug)

    if (Number.isNaN(id)) {
      throw new TypeError(`Genre ${name} has no valid id`)
    }

    return { name, id }
  }).get()
}

export function getCsfdId(csfdSlug: string): number {
  const id = Number.parseInt(csfdSlug)
  if (Number.isNaN(id)) {
    throw new TypeError(`Csfd slug ${csfdSlug} has no valid id`)
  }
  return id
}

export async function findCsfdMovieSlugByCzechTitle(html: string, title: string, year: number): Promise<string | null> {
  const $ = cheerio.load(html)
  const url = $('#snippet--containerFilms .film-title-nooverflow').filter(function () {
    const czechTitleWithYear = removeAfterFirstParentheses($(this).text().trim())
    return czechTitleWithYear.toLowerCase() === `${title} (${year})`.toLowerCase()
  }).find('a').attr('href')

  return extractCsfdSlugFromUrl(url)
}

export async function findCsfdTvShowSlugByCzechTitle(html: string, title: string): Promise<string | null> {
  const $ = cheerio.load(html)
  const url = $('#snippet--containerSeries .film-title-nooverflow').filter(function () {
    const czechTitle = removeAfterFirstParentheses($(this).find('a').text().trim())
    return czechTitle.toLowerCase() === title.toLowerCase()
  }).find('a').attr('href')

  return extractCsfdSlugFromUrl(url)
}

export async function findCsfdMovieSlugByOriginalTitle(html: string, title: string, year: number): Promise<string | null> {
  const $ = cheerio.load(html)
  const url = $('#snippet--containerFilms .article-header').filter(function () {
    const originalTitle = $(this).find('p.search-name').text().replace(/[()]/g, '').trim()
    const releaseYear = $(this).find('span.info').text().replace(/[()]/g, '').trim()

    return originalTitle.toLowerCase() === title.toLowerCase() && releaseYear === year.toString()
  }).find('a').attr('href')

  return extractCsfdSlugFromUrl(url)
}

export async function findCsfdTvShowSlugByOriginalTitle(html: string, title: string): Promise<string | null> {
  const $ = cheerio.load(html)
  const url = $('#snippet--containerSeries .article-header').filter(function () {
    const originalTitle = $(this).find('p.search-name').text().replace(/[()]/g, '').trim()
    return originalTitle.toLowerCase() === title.toLowerCase()
  }).find('a').attr('href')

  return extractCsfdSlugFromUrl(url)
}

function getOriginalTitle($: CheerioAPI, countries: string): string {
  return $('ul.film-names')
    .children()
    .filter(function () {
      const country = $(this).find('img').attr('title')
      return country === countries.split('/')[0].trim()
    })
    .first()
    .contents()
    .filter(function () {
      return this.type === 'text'
    })
    .text()
    .trim()
}

function extractCsfdSlugFromUrl(url: string | undefined): string | null {
  if (!url)
    return null

  const parts = url.split('/').filter(Boolean)
  return parts[parts.length - 1]
}

function removeAfterFirstParentheses(text: string): string {
  const match = text.match(/^([^(]*\([^)]*\))/)
  return match ? match[1] : text
}
