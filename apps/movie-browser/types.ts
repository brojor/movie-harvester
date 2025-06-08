export const SORT_BY_OPTIONS = [
  { label: 'Název', value: 'title' },
  { label: 'Rok', value: 'year' },
  { label: 'Hodnocení', value: 'rating' },
  { label: 'Datum vydání', value: 'releaseDate' },
] as const

export const RATING_SOURCE_OPTIONS = [
  { label: 'ČSFD', value: 'csfd' },
  { label: 'TMDB', value: 'tmdb' },
  { label: 'Rotten Tomatoes', value: 'rt' },
] as const

export const ORDER_OPTIONS = ['asc', 'desc'] as const

type ValueOf<T extends readonly { value: any }[]> = T[number]['value']

export interface SearchParams {
  sortBy: ValueOf<typeof SORT_BY_OPTIONS>
  ratingSource: ValueOf<typeof RATING_SOURCE_OPTIONS>
  order: typeof ORDER_OPTIONS[number]
}
