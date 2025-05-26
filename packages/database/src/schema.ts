import { relations, sql } from 'drizzle-orm'
import { int, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

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
    createdAt: int({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: int({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  table => [
    uniqueIndex('unique_czech_title_year').on(table.czechTitle, table.year),
    uniqueIndex('unique_original_title_year').on(table.originalTitle, table.year),
  ],
)

export const genres = sqliteTable('genres', {
  id: int('id').primaryKey(),
  name: text('name').notNull(),
})

export const tmdbInfo = sqliteTable('tmdb_info', {
  id: int().primaryKey().references(() => moviesSource.id),
  tmdbId: int().notNull(),
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

export const moviesToGenres = sqliteTable(
  'movies_to_genres',
  {
    movieId: int().notNull().references(() => tmdbInfo.id),
    genreId: int().notNull().references(() => genres.id),
  },
  t => [primaryKey({ columns: [t.movieId, t.genreId] })],
)

export const genresRelations = relations(genres, ({ many }) => ({
  movieGenres: many(moviesToGenres),
}))

export const moviesRelations = relations(tmdbInfo, ({ many }) => ({
  movieGenres: many(moviesToGenres),
}))

export const moviesToGenresRelations = relations(moviesToGenres, ({ one }) => ({
  movie: one(tmdbInfo, {
    fields: [moviesToGenres.movieId],
    references: [tmdbInfo.id],
  }),
  genre: one(genres, {
    fields: [moviesToGenres.genreId],
    references: [genres.id],
  }),
}))

export const ratings = sqliteTable('ratings', {
  id: int().primaryKey().references(() => moviesSource.id),
  csfd: real(),
  rt: real(),
  createdAt: int({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: int({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const ratingsRelations = relations(ratings, ({ one }) => ({
  movie: one(moviesSource, {
    fields: [ratings.id],
    references: [moviesSource.id],
  }),
}))

export const moviesSourceRelations = relations(moviesSource, ({ one }) => ({
  tmdbInfo: one(tmdbInfo),
  ratings: one(ratings),
}))
