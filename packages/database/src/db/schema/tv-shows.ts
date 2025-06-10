import { relations, sql } from 'drizzle-orm'
import {
  int,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { timestamps } from './common.js'

export const tvShowSources = sqliteTable('tv_shows', {
  id: int().primaryKey({ autoIncrement: true }),
  czechTitle: text(),
  originalTitle: text().notNull().unique(),
  ...timestamps,
})

export const tvShowTopics = sqliteTable('tv_show_topics', {
  id: int().primaryKey({ autoIncrement: true }),
  tvShowId: int().notNull().references(() => tvShowSources.id),
  topicId: int().notNull(),
  topicType: text().notNull(),
  languages: text().notNull(),
  createdAt: int({ mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
})

export const tmdbTvShowsData = sqliteTable('tmdb_tv_shows_data', {
  id: int().primaryKey({ autoIncrement: true }),
  sourceId: int().references(() => tvShowSources.id),
  name: text().notNull(),
  originalName: text().notNull(),
  originalLanguage: text().notNull(),
  overview: text(),
  posterPath: text(),
  backdropPath: text(),
  firstAirDate: text(),
  episodeRunTime: text().notNull(),
  numberOfEpisodes: int(),
  numberOfSeasons: int(),
  originCountry: text().notNull(),
  languages: text().notNull(),
  type: text(),
  popularity: real(),
  voteAverage: real(),
  voteCount: int(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_tmdb_tv_show_source').on(table.sourceId),
])

export const tmdbTvShowGenres = sqliteTable('tmdb_tv_show_genres', {
  id: int('id').primaryKey(),
  name: text('name').notNull(),
})

export const tmdbTvShowToGenres = sqliteTable('tmdb_tv_show_to_genres', {
  tvShowId: int().references(() => tmdbTvShowsData.id),
  genreId: int().references(() => tmdbTvShowGenres.id),
}, t => [primaryKey({ columns: [t.tvShowId, t.genreId] })])

export const networks = sqliteTable('networks', {
  id: int().primaryKey(),
  name: text().notNull(),
  logoPath: text(),
  originCountry: text(),
})

export const tvShowNetworks = sqliteTable('tv_show_networks', {
  tvShowId: int().references(() => tmdbTvShowsData.id),
  networkId: int().references(() => networks.id),
})

export const seasons = sqliteTable('seasons', {
  id: int().primaryKey(),
  tvShowId: int().references(() => tmdbTvShowsData.id),
  name: text().notNull(),
  overview: text(),
  posterPath: text(),
  seasonNumber: int().notNull(),
  voteAverage: real(),
  episodeCount: int(),
  airDate: text(),
})

// TV Show Relations
export const tvShowSourcesRelations = relations(tvShowSources, ({ many }) => ({
  topics: many(tvShowTopics),
}))

export const tvShowTopicsRelations = relations(tvShowTopics, ({ one }) => ({
  tvShow: one(tvShowSources, {
    fields: [tvShowTopics.tvShowId],
    references: [tvShowSources.id],
  }),
}))

export const tvShowRelations = relations(tmdbTvShowsData, ({ many }) => ({
  genres: many(tmdbTvShowToGenres),
  networks: many(tvShowNetworks),
  seasons: many(seasons),
}))

// Genre Relations
export const genreRelations = relations(tmdbTvShowGenres, ({ many }) => ({
  tmdbTvShowsData: many(tmdbTvShowToGenres),
}))

// TVShowGenres Relations
export const tvShowGenresRelations = relations(tmdbTvShowToGenres, ({ one }) => ({
  tvShow: one(tmdbTvShowsData, {
    fields: [tmdbTvShowToGenres.tvShowId],
    references: [tmdbTvShowsData.id],
  }),
  genre: one(tmdbTvShowGenres, {
    fields: [tmdbTvShowToGenres.genreId],
    references: [tmdbTvShowGenres.id],
  }),
}))

// Network Relations
export const networkRelations = relations(networks, ({ many }) => ({
  tmdbTvShowsData: many(tvShowNetworks),
}))

// TVShowNetworks Relations
export const tvShowNetworksRelations = relations(tvShowNetworks, ({ one }) => ({
  tvShow: one(tmdbTvShowsData, {
    fields: [tvShowNetworks.tvShowId],
    references: [tmdbTvShowsData.id],
  }),
  network: one(networks, {
    fields: [tvShowNetworks.networkId],
    references: [networks.id],
  }),
}))

// Season Relations
export const seasonRelations = relations(seasons, ({ one }) => ({
  tvShow: one(tmdbTvShowsData, {
    fields: [seasons.tvShowId],
    references: [tmdbTvShowsData.id],
  }),
}))
