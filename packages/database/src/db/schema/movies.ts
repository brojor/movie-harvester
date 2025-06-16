import { relations } from 'drizzle-orm'
import {
  integer,
  pgTable,
  primaryKey,
  real,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { csfdGenres, timestamps } from './common.js'

// Movies source
export const movieSources = pgTable(
  'movie_sources',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    czechTitle: text(),
    originalTitle: text(),
    year: integer().notNull(),
    hd: integer(),
    uhd: integer(),
    hdDub: integer(),
    uhdDub: integer(),
    ...timestamps,
  },
  table => [
    uniqueIndex('unique_czech_movie_title_year').on(table.czechTitle, table.year),
    uniqueIndex('unique_original_movie_title_year').on(table.originalTitle, table.year),
  ],
)

// TMDB
export const tmdbMovieData = pgTable('tmdb_movie_data', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  sourceId: integer().references(() => movieSources.id),
  imdbId: text(),
  title: text(),
  originalTitle: text(),
  originalLanguage: text(),
  originCountry: text(),
  posterPath: text(),
  backdropPath: text(),
  releaseDate: text(),
  runtime: integer(),
  voteAverage: real(),
  voteCount: integer(),
  tagline: text(),
  overview: text(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_tmdb_movie_source').on(table.sourceId),
])

export const tmdbMovieGenres = pgTable('tmdb_movie_genres', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
})

export const tmdbMoviesToGenres = pgTable(
  'tmdb_movies_to_genres',
  {
    movieId: integer().notNull().references(() => tmdbMovieData.id),
    genreId: integer().notNull().references(() => tmdbMovieGenres.id),
  },
  t => [primaryKey({ columns: [t.movieId, t.genreId] })],
)

// CSFD
export const csfdMovieData = pgTable('csfd_movie_data', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  csfdId: text().notNull(),
  sourceId: integer().references(() => movieSources.id),
  title: text(),
  originalTitle: text(),
  releaseYear: integer(),
  runtime: integer(),
  voteAverage: integer(),
  voteCount: integer(),
  posterPath: text(),
  overview: text(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_csfd_movie_source').on(table.sourceId),
  uniqueIndex('unique_csfd_movie_id').on(table.csfdId),
])

export const csfdMoviesToGenres = pgTable(
  'csfd_movies_to_genres',
  {
    csfdId: integer().notNull().references(() => csfdMovieData.id),
    genreId: integer().notNull().references(() => csfdGenres.id),
  },
  t => [primaryKey({ columns: [t.csfdId, t.genreId] })],
)

// RT
export const rtMovieData = pgTable('rt_movie_data', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  rtId: text().notNull(),
  sourceId: integer().references(() => movieSources.id),
  criticsScore: integer(),
  criticsReviews: integer(),
  audienceScore: integer(),
  audienceReviews: integer(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_rt_movie_source').on(table.sourceId),
  uniqueIndex('unique_rt_movie_id').on(table.rtId),
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

export const tmdbGenresRelations = relations(tmdbMovieGenres, ({ many }) => ({
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
  genre: one(tmdbMovieGenres, {
    fields: [tmdbMoviesToGenres.genreId],
    references: [tmdbMovieGenres.id],
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
