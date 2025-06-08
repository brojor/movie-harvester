import { relations, sql } from 'drizzle-orm'
import {
  int,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

const timestamps = {
  createdAt: int({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: int({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}

// Movies source
export const moviesSource = sqliteTable(
  'movies_source',
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
export const tmdbData = sqliteTable('tmdb_data', {
  id: int().primaryKey({ autoIncrement: true }),
  sourceId: int().references(() => moviesSource.id),
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
  uniqueIndex('unique_tmdb_source').on(table.sourceId),
])

export const tmdbGenres = sqliteTable('tmdb_genres', {
  id: int('id').primaryKey(),
  name: text('name').notNull(),
})

export const tmdbToGenres = sqliteTable(
  'tmdb_to_genres',
  {
    movieId: int().notNull().references(() => tmdbData.id),
    genreId: int().notNull().references(() => tmdbGenres.id),
  },
  t => [primaryKey({ columns: [t.movieId, t.genreId] })],
)

// CSFD
export const csfdData = sqliteTable('csfd_data', {
  id: int().primaryKey({ autoIncrement: true }),
  csfdId: text().notNull(),
  sourceId: int().references(() => moviesSource.id),
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
  uniqueIndex('unique_csfd_source').on(table.sourceId),
  uniqueIndex('unique_csfd_id').on(table.csfdId),
])

export const csfdGenres = sqliteTable('csfd_genres', {
  id: int('id').primaryKey(),
  name: text('name').notNull(),
})

export const csfdToGenres = sqliteTable(
  'csfd_to_genres',
  {
    csfdId: int().notNull().references(() => csfdData.id),
    genreId: int().notNull().references(() => csfdGenres.id),
  },
  t => [primaryKey({ columns: [t.csfdId, t.genreId] })],
)

// RT
export const rtData = sqliteTable('rt_data', {
  id: int().primaryKey({ autoIncrement: true }),
  rtId: text().notNull(),
  sourceId: int().references(() => moviesSource.id),
  criticsScore: int(),
  criticsReviews: int(),
  audienceScore: int(),
  audienceReviews: int(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_rt_source').on(table.sourceId),
  uniqueIndex('unique_rt_id').on(table.rtId),
])

// Relations
export const moviesSourceRelations = relations(moviesSource, ({ one }) => ({
  tmdbData: one(tmdbData, {
    fields: [moviesSource.id],
    references: [tmdbData.sourceId],
  }),
  csfdData: one(csfdData, {
    fields: [moviesSource.id],
    references: [csfdData.sourceId],
  }),
  rtData: one(rtData, {
    fields: [moviesSource.id],
    references: [rtData.sourceId],
  }),
}))

export const tmdbDataRelations = relations(tmdbData, ({ one, many }) => ({
  movieSource: one(moviesSource, {
    fields: [tmdbData.sourceId],
    references: [moviesSource.id],
  }),
  genres: many(tmdbToGenres),
}))

export const csfdDataRelations = relations(csfdData, ({ one, many }) => ({
  movieSource: one(moviesSource, {
    fields: [csfdData.sourceId],
    references: [moviesSource.id],
  }),
  genres: many(csfdToGenres),
}))

export const rtDataRelations = relations(rtData, ({ one }) => ({
  movieSource: one(moviesSource, {
    fields: [rtData.sourceId],
    references: [moviesSource.id],
  }),
}))

export const tmdbGenresRelations = relations(tmdbGenres, ({ many }) => ({
  movies: many(tmdbToGenres),
}))

export const csfdGenresRelations = relations(csfdGenres, ({ many }) => ({
  movies: many(csfdToGenres),
}))

export const tmdbToGenresRelations = relations(tmdbToGenres, ({ one }) => ({
  movie: one(tmdbData, {
    fields: [tmdbToGenres.movieId],
    references: [tmdbData.id],
  }),
  genre: one(tmdbGenres, {
    fields: [tmdbToGenres.genreId],
    references: [tmdbGenres.id],
  }),
}))

export const csfdToGenresRelations = relations(csfdToGenres, ({ one }) => ({
  movie: one(csfdData, {
    fields: [csfdToGenres.csfdId],
    references: [csfdData.id],
  }),
  genre: one(csfdGenres, {
    fields: [csfdToGenres.genreId],
    references: [csfdGenres.id],
  }),
}))
