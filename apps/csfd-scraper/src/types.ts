export interface CsfdMovieDetails {
  title: string
  originalTitle: string
  releaseYear: number
  runtime: number | null
  voteAverage: number | null
  voteCount: number | null
  posterPath: string | null
  overview: string | null
  genres: string[]
  csfdId: string
}
