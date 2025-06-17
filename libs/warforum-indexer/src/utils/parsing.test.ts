import { describe, expect, it } from 'vitest'
import { parseMovieCoreMeta, parseTvShowCoreMeta } from './parsing.js'

describe('parseMovieCoreMeta', () => {
  it('should parse dubbed movie with both titles', () => {
    expect(parseMovieCoreMeta('Czech title / Original title (1978)', true)).toMatchObject({
      czechTitle: 'Czech title',
      originalTitle: 'Original title',
      year: 1978,
    })
  })

  it('should parse non-dubbed movie with both titles', () => {
    expect(parseMovieCoreMeta('Original title / Czech title (1978)', false)).toMatchObject({
      czechTitle: 'Czech title',
      originalTitle: 'Original title',
      year: 1978,
    })
  })

  it('should parse dubbed movie with only czech title', () => {
    expect(parseMovieCoreMeta('Czech title (1978)', true)).toMatchObject({
      czechTitle: 'Czech title',
      year: 1978,
      originalTitle: undefined,
    })
  })

  it('should parse non-dubbed movie with only original title', () => {
    expect(parseMovieCoreMeta('Original title (1978)', false)).toMatchObject({
      originalTitle: 'Original title',
      year: 1978,
      czechTitle: undefined,
    })
  })
})

describe('parseTvShowCoreMeta', () => {
  it('should parse tv show with both titles', () => {
    expect(parseTvShowCoreMeta('Czech title / Original title / EN, DE')).toMatchObject({
      czechTitle: 'Czech title',
      originalTitle: 'Original title',
      languages: ['EN', 'DE'],
    })
  })

  it('should parse tv show with only original title', () => {
    expect(parseTvShowCoreMeta('Original title / EN, DE')).toMatchObject({
      originalTitle: 'Original title',
      languages: ['EN', 'DE'],
    })
  })

  it('should parse tv show with only one language', () => {
    expect(parseTvShowCoreMeta('Original title / EN')).toMatchObject({
      originalTitle: 'Original title',
      languages: ['EN'],
    })
  })

  it('should parse tv show with multiple languages', () => {
    expect(parseTvShowCoreMeta('Original title / EN, DE, FR')).toMatchObject({
      originalTitle: 'Original title',
      languages: ['EN', 'DE', 'FR'],
    })
  })

  it('should parse tv show with three-letter language code', () => {
    expect(parseTvShowCoreMeta('Original title / ENG')).toMatchObject({
      originalTitle: 'Original title',
      languages: ['ENG'],
    })
  })

  it('should parse tv show with lowercase language code', () => {
    expect(parseTvShowCoreMeta('Original title / en')).toMatchObject({
      originalTitle: 'Original title',
      languages: ['en'],
    })
  })

  it('should parse tv show with non-latin characters', () => {
    expect(parseTvShowCoreMeta('Czech title / Undesired string / Original title / CZ, KO')).toMatchObject({
      czechTitle: 'Czech title',
      originalTitle: 'Original title',
      languages: ['CZ', 'KO'],
    })
  })
})
