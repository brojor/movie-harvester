// CSFD types
export interface CsfdGenre {
  name: string
  id: number
}

export interface CsfdMovieDetails {
  id: number
  title: string
  originalTitle: string
  releaseYear: number
  runtime: number | null
  voteAverage: number | null
  voteCount: number | null
  posterPath: string | null
  overview: string | null
  genres: CsfdGenre[]
}

export type CsfdTvShowDetails = Omit<CsfdMovieDetails, 'runtime' | 'originalTitle' | 'releaseYear'>
