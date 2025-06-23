import { relations } from 'drizzle-orm'
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { csfdGenres, timestamps } from './common.js'

export const topicTypeEnum = pgEnum('topic_type', ['hd', 'uhd', 'hdDub', 'uhdDub'])

export const tmdbMovieData = pgTable('tmdb_movie_data', {
  id: integer().primaryKey(),
  imdbId: text(),
  title: text(),
  originalTitle: text(),
  originalLanguage: text(),
  originCountry: text().array(),
  posterPath: text(),
  backdropPath: text(),
  releaseDate: text(),
  runtime: integer(),
  voteAverage: real(),
  voteCount: integer(),
  tagline: text(),
  overview: text(),
  ...timestamps,
})

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

export const csfdMovieData = pgTable('csfd_movie_data', {
  id: integer().primaryKey(),
  title: text(),
  originalTitle: text(),
  releaseYear: integer(),
  runtime: integer(),
  voteAverage: integer(),
  voteCount: integer(),
  posterPath: text(),
  overview: text(),
  ...timestamps,
})

export const csfdMoviesToGenres = pgTable(
  'csfd_movies_to_genres',
  {
    csfdId: integer().notNull().references(() => csfdMovieData.id),
    genreId: integer().notNull().references(() => csfdGenres.id),
  },
  t => [primaryKey({ columns: [t.csfdId, t.genreId] })],
)

export const rtMovieData = pgTable('rt_movie_data', {
  id: text().primaryKey(),
  criticsScore: integer(),
  criticsReviews: integer(),
  audienceScore: integer(),
  audienceReviews: integer(),
  ...timestamps,
})

export const movies = pgTable(
  'movies',
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    czechTitle: text(),
    originalTitle: text(),
    year: integer().notNull(),
    tmdbId: integer(),
    csfdId: integer(),
    rtId: text(),
    ...timestamps,
  },
  table => [
    uniqueIndex('unique_czech_movie_title_year').on(table.czechTitle, table.year),
    uniqueIndex('unique_original_movie_title_year').on(table.originalTitle, table.year),
  ],
)

export const movieTopics = pgTable('movie_topics', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  movieId: integer().notNull().references(() => movies.id),
  topicId: integer().notNull(),
  sourceType: topicTypeEnum().notNull(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_movie_source_type').on(table.movieId, table.sourceType),
])

export const moviesRelations = relations(movies, ({ one, many }) => ({
  tmdbData: one(tmdbMovieData, {
    fields: [movies.tmdbId],
    references: [tmdbMovieData.id],
  }),
  csfdData: one(csfdMovieData, {
    fields: [movies.csfdId],
    references: [csfdMovieData.id],
  }),
  rtData: one(rtMovieData, {
    fields: [movies.rtId],
    references: [rtMovieData.id],
  }),
  topics: many(movieTopics),
}))

export const movieTopicsRelations = relations(movieTopics, ({ one }) => ({
  movie: one(movies, {
    fields: [movieTopics.movieId],
    references: [movies.id],
  }),
}))

export const tmdbDataRelations = relations(tmdbMovieData, ({ one, many }) => ({
  movieSource: one(movies, {
    fields: [tmdbMovieData.id],
    references: [movies.tmdbId],
  }),
  genres: many(tmdbMoviesToGenres),
}))

export const csfdDataRelations = relations(csfdMovieData, ({ one, many }) => ({
  movieSource: one(movies, {
    fields: [csfdMovieData.id],
    references: [movies.csfdId],
  }),
  genres: many(csfdMoviesToGenres),
}))

export const rtDataRelations = relations(rtMovieData, ({ one }) => ({
  movieSource: one(movies, {
    fields: [rtMovieData.id],
    references: [movies.rtId],
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
