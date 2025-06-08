import { relations } from 'drizzle-orm'
import {
  int,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { timestamps, tmdbGenres } from './common.js'

// Movies source
export const movieSources = sqliteTable(
  'movie_sources',
  {
    id: int().primaryKey({ autoIncrement: true }),
    czechTitle: text().notNull(),
    originalTitle: text().notNull(),
    year: int().notNull(),
    hd: int(),
    uhd: int(),
    hdDub: int(),
    uhdDub: int(),
    ...timestamps,
  },
  table => [
    uniqueIndex('unique_czech_title_year').on(table.czechTitle, table.year),
    uniqueIndex('unique_original_title_year').on(table.originalTitle, table.year),
  ],
)

// TMDB
export const tmdbMovieData = sqliteTable('tmdb_movie_data', {
  id: int().primaryKey({ autoIncrement: true }),
  sourceId: int().references(() => movieSources.id),
  imdbId: text(),
  title: text(),
  originalTitle: text(),
  originalLanguage: text(),
  posterPath: text(),
  backdropPath: text(),
  releaseDate: text(),
  runtime: int(),
  voteAverage: real(),
  voteCount: int(),
  tagline: text(),
  overview: text(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_tmdb_movie_source').on(table.sourceId),
])

export const tmdbMoviesToGenres = sqliteTable(
  'tmdb_movies_to_genres',
  {
    movieId: int().notNull().references(() => tmdbMovieData.id),
    genreId: int().notNull().references(() => tmdbGenres.id),
  },
  t => [primaryKey({ columns: [t.movieId, t.genreId] })],
)

// CSFD
export const csfdMovieData = sqliteTable('csfd_movie_data', {
  id: int().primaryKey({ autoIncrement: true }),
  csfdId: text().notNull(),
  sourceId: int().references(() => movieSources.id),
  title: text(),
  originalTitle: text(),
  releaseYear: int(),
  runtime: int(),
  voteAverage: int(),
  voteCount: int(),
  posterPath: text(),
  overview: text(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_csfd_movie_source').on(table.sourceId),
  uniqueIndex('unique_csfd_id').on(table.csfdId),
])

export const csfdGenres = sqliteTable('csfd_genres', {
  id: int('id').primaryKey(),
  name: text('name').notNull(),
})

export const csfdMoviesToGenres = sqliteTable(
  'csfd_movies_to_genres',
  {
    csfdId: int().notNull().references(() => csfdMovieData.id),
    genreId: int().notNull().references(() => csfdGenres.id),
  },
  t => [primaryKey({ columns: [t.csfdId, t.genreId] })],
)

// RT
export const rtMovieData = sqliteTable('rt_movie_data', {
  id: int().primaryKey({ autoIncrement: true }),
  rtId: text().notNull(),
  sourceId: int().references(() => movieSources.id),
  criticsScore: int(),
  criticsReviews: int(),
  audienceScore: int(),
  audienceReviews: int(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_rt_movie_source').on(table.sourceId),
  uniqueIndex('unique_rt_id').on(table.rtId),
])

// Relations
export const moviesSourceRelations = relations(movieSources, ({ one }) => ({
  tmdbData: one(tmdbMovieData, {
    fields: [movieSources.id],
    references: [tmdbMovieData.sourceId],
  }),
  csfdData: one(csfdMovieData, {
    fields: [movieSources.id],
    references: [csfdMovieData.sourceId],
  }),
  rtData: one(rtMovieData, {
    fields: [movieSources.id],
    references: [rtMovieData.sourceId],
  }),
}))

export const tmdbDataRelations = relations(tmdbMovieData, ({ one, many }) => ({
  movieSource: one(movieSources, {
    fields: [tmdbMovieData.sourceId],
    references: [movieSources.id],
  }),
  genres: many(tmdbMoviesToGenres),
}))

export const csfdDataRelations = relations(csfdMovieData, ({ one, many }) => ({
  movieSource: one(movieSources, {
    fields: [csfdMovieData.sourceId],
    references: [movieSources.id],
  }),
  genres: many(csfdMoviesToGenres),
}))

export const rtDataRelations = relations(rtMovieData, ({ one }) => ({
  movieSource: one(movieSources, {
    fields: [rtMovieData.sourceId],
    references: [movieSources.id],
  }),
}))

export const tmdbGenresRelations = relations(tmdbGenres, ({ many }) => ({
  movies: many(tmdbMoviesToGenres),
}))

export const csfdGenresRelations = relations(csfdGenres, ({ many }) => ({
  movies: many(csfdMoviesToGenres),
}))

export const tmdbToGenresRelations = relations(tmdbMoviesToGenres, ({ one }) => ({
  movie: one(tmdbMovieData, {
    fields: [tmdbMoviesToGenres.movieId],
    references: [tmdbMovieData.id],
  }),
  genre: one(tmdbGenres, {
    fields: [tmdbMoviesToGenres.genreId],
    references: [tmdbGenres.id],
  }),
}))

export const csfdToGenresRelations = relations(csfdMoviesToGenres, ({ one }) => ({
  movie: one(csfdMovieData, {
    fields: [csfdMoviesToGenres.csfdId],
    references: [csfdMovieData.id],
  }),
  genre: one(csfdGenres, {
    fields: [csfdMoviesToGenres.genreId],
    references: [csfdGenres.id],
  }),
}))
