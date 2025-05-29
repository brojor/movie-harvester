import { relations, sql } from 'drizzle-orm'
import {
  int,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

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
    csfdId: text(),
    tmdbId: int(),
    rtId: text(),
    createdAt: int({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: int({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  table => [
    uniqueIndex('unique_czech_title_year').on(table.czechTitle, table.year),
    uniqueIndex('unique_original_title_year').on(table.originalTitle, table.year),
    uniqueIndex('unique_tmdb_id').on(table.tmdbId),
    uniqueIndex('unique_csfd_id').on(table.csfdId),
    uniqueIndex('unique_rt_id').on(table.rtId),
  ],
)

export const genres = sqliteTable('genres', {
  id: int('id').primaryKey(),
  name: text('name').notNull(),
})

export const tmdbData = sqliteTable('tmdb_data', {
  id: int().primaryKey(),
  sourceId: int().references(() => moviesSource.id),
  imdbId: text().notNull(),
  title: text().notNull(),
  originalTitle: text().notNull(),
  originalLanguage: text().notNull(),
  posterPath: text().notNull(),
  backdropPath: text().notNull(),
  releaseDate: text().notNull(),
  runtime: int().notNull(),
  voteAverage: real().notNull(),
  voteCount: int().notNull(),
  tagline: text().notNull(),
  overview: text().notNull(),
})

export const csfdData = sqliteTable('csfd_data', {
  id: int().primaryKey(),
  sourceId: int().references(() => moviesSource.id),
  title: text().notNull(),
  originalTitle: text().notNull(),
  releaseYear: int().notNull(),
  runtime: int().notNull(),
  voteAverage: real().notNull(),
  voteCount: int().notNull(),
  posterPath: text().notNull(),
  overview: text().notNull(),
})

export const rtData = sqliteTable('rt_data', {
  id: int().primaryKey(),
  sourceId: int().references(() => moviesSource.id),
  criticsScore: real().notNull(),
  criticsReviews: int().notNull(),
  audienceScore: real().notNull(),
  audienceReviews: int().notNull(),
})

export const moviesToGenres = sqliteTable(
  'movies_to_genres',
  {
    movieId: int().notNull().references(() => tmdbData.id),
    genreId: int().notNull().references(() => genres.id),
  },
  t => [primaryKey({ columns: [t.movieId, t.genreId] })],
)

// RELATIONS
export const genresRelations = relations(genres, ({ many }) => ({
  genres: many(moviesToGenres),
}))

export const moviesRelations = relations(tmdbData, ({ many }) => ({
  genres: many(moviesToGenres),
}))

export const moviesToGenresRelations = relations(moviesToGenres, ({ one }) => ({
  movie: one(tmdbData, {
    fields: [moviesToGenres.movieId],
    references: [tmdbData.id],
  }),
  genre: one(genres, {
    fields: [moviesToGenres.genreId],
    references: [genres.id],
  }),
}))

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

export const tmdbDataRelations = relations(tmdbData, ({ one }) => ({
  movieSource: one(moviesSource, {
    fields: [tmdbData.sourceId],
    references: [moviesSource.id],
  }),
}))

export const csfdDataRelations = relations(csfdData, ({ one }) => ({
  movieSource: one(moviesSource, {
    fields: [csfdData.sourceId],
    references: [moviesSource.id],
  }),
}))

export const rtDataRelations = relations(rtData, ({ one }) => ({
  movieSource: one(moviesSource, {
    fields: [rtData.sourceId],
    references: [moviesSource.id],
  }),
}))
