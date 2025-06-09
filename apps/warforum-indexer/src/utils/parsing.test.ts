import { expect, it } from 'vitest'
import { parseMovieCoreMeta } from './parsing.js'

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
