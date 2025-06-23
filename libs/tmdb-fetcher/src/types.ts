export interface SearchResponse {
  page: number
  total_pages: number
  total_results: number
}

export interface MovieSearchResponse extends SearchResponse {
  results: MovieSearchResult[]
}

export interface TvShowSearchResponse extends SearchResponse {
  results: TvShowSearchResult[]
}

export interface MovieSearchResult {
  adult: boolean
  backdrop_path?: string
  genre_ids: any[]
  id: number
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string
  release_date: string
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

export interface TvShowSearchResult {
  adult: boolean
  backdrop_path: string
  genre_ids: number[]
  id: number
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string
  first_air_date: string
  name: string
  vote_average: number
  vote_count: number
}

export interface MovieDetailsResponse {
  adult: boolean
  backdrop_path: string
  belongs_to_collection: any
  budget: number
  genres: Genre[]
  homepage: string
  id: number
  imdb_id: string
  origin_country: string[]
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string
  production_companies: ProductionCompany[]
  production_countries: ProductionCountry[]
  release_date: string
  revenue: number
  runtime: number
  spoken_languages: SpokenLanguage[]
  status: string
  tagline: string
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

export interface Genre {
  id: number
  name: string
}

export interface ProductionCompany {
  id: number
  logo_path: string
  name: string
  origin_country: string
}

export interface ProductionCountry {
  iso_3166_1: string
  name: string
}

export interface SpokenLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

export interface SearchMovieCandidate {
  title: string
  year: number
}

export interface SearchTvShowCandidate {
  title: string
}

export interface TvShowDetailsResponse {
  adult: boolean
  backdrop_path: string
  created_by: CreatedBy[]
  episode_run_time: number[]
  first_air_date: string
  genres: Genre[]
  homepage: string
  id: number
  in_production: boolean
  languages: string[]
  last_air_date: string
  last_episode_to_air: LastEpisodeToAir
  name: string
  next_episode_to_air: any
  networks: Network[]
  number_of_episodes: number
  number_of_seasons: number
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string
  production_companies: ProductionCompany[]
  production_countries: ProductionCountry[]
  seasons: Season[]
  spoken_languages: SpokenLanguage[]
  status: string
  tagline: string
  type: string
  vote_average: number
  vote_count: number
}

export interface CreatedBy {
  id: number
  credit_id: string
  name: string
  original_name: string
  gender: number
  profile_path?: string
}

export interface LastEpisodeToAir {
  id: number
  name: string
  overview: string
  vote_average: number
  vote_count: number
  air_date: string
  episode_number: number
  episode_type: string
  production_code: string
  runtime: number
  season_number: number
  show_id: number
  still_path: string
}

export interface Network {
  id: number
  logo_path: string
  name: string
  origin_country: string
}

export interface Season {
  air_date: string
  episode_count: number
  id: number
  name: string
  overview: string
  poster_path: string
  season_number: number
  vote_average: number
}
export interface TmdbMovieDetails {
  id: number
  imdbId: string
  title: string
  originalTitle: string
  originalLanguage: string
  originCountry: string[]
  posterPath: string
  backdropPath: string
  releaseDate: string
  runtime: number
  voteAverage: number
  voteCount: number
  tagline: string
  overview: string
  genres: Genre[]
}

export interface TmdbTvShowDetails {
  id: number
  name: string
  originalName: string
  originalLanguage: string
  overview: string
  posterPath: string
  backdropPath: string
  firstAirDate: string
  episodeRunTime: number[]
  numberOfEpisodes: number
  numberOfSeasons: number
  originCountry: string[]
  languages: string[]
  type: string
  popularity: number
  voteAverage: number
  voteCount: number
  genres: Genre[]
}
