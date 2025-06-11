import { relations } from 'drizzle-orm'
import {
  int,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'
import { timestamps } from './common.js'

export const tvShowSources = sqliteTable('tv_show_sources', {
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
  ...timestamps,
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
  id: int().primaryKey(),
  name: text().notNull(),
})

export const tmdbTvShowsToGenres = sqliteTable('tmdb_tv_shows_to_genres', {
  tvShowId: int().references(() => tmdbTvShowsData.id),
  genreId: int().references(() => tmdbTvShowGenres.id),
}, t => [primaryKey({ columns: [t.tvShowId, t.genreId] })])

export const tmdbNetworks = sqliteTable('tmdb_networks', {
  id: int().primaryKey(),
  name: text().notNull(),
  logoPath: text(),
  originCountry: text(),
})

export const tmdbTvShowToNetworks = sqliteTable('tmdb_tv_show_to_networks', {
  tvShowId: int().references(() => tmdbTvShowsData.id),
  networkId: int().references(() => tmdbNetworks.id),
})

export const tmdbSeasons = sqliteTable('tmdb_seasons', {
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

export const tmdbTvShowsDataRelations = relations(tmdbTvShowsData, ({ many }) => ({
  genres: many(tmdbTvShowsToGenres),
  networks: many(tmdbTvShowToNetworks),
  seasons: many(tmdbSeasons),
}))

// Genre Relations
export const tmdbTvShowGenresRelations = relations(tmdbTvShowGenres, ({ many }) => ({
  tmdbTvShowsData: many(tmdbTvShowsToGenres),
}))

// TVShowGenres Relations
export const tmdbTvShowsToGenresRelations = relations(tmdbTvShowsToGenres, ({ one }) => ({
  tvShow: one(tmdbTvShowsData, {
    fields: [tmdbTvShowsToGenres.tvShowId],
    references: [tmdbTvShowsData.id],
  }),
  genre: one(tmdbTvShowGenres, {
    fields: [tmdbTvShowsToGenres.genreId],
    references: [tmdbTvShowGenres.id],
  }),
}))

// Network Relations
export const tmdbNetworksRelations = relations(tmdbNetworks, ({ many }) => ({
  tmdbTvShowsData: many(tmdbTvShowToNetworks),
}))

// TVShowNetworks Relations
export const tmdbTvShowToNetworksRelations = relations(tmdbTvShowToNetworks, ({ one }) => ({
  tvShow: one(tmdbTvShowsData, {
    fields: [tmdbTvShowToNetworks.tvShowId],
    references: [tmdbTvShowsData.id],
  }),
  network: one(tmdbNetworks, {
    fields: [tmdbTvShowToNetworks.networkId],
    references: [tmdbNetworks.id],
  }),
}))

// Season Relations
export const tmdbSeasonsRelations = relations(tmdbSeasons, ({ one }) => ({
  tvShow: one(tmdbTvShowsData, {
    fields: [tmdbSeasons.tvShowId],
    references: [tmdbTvShowsData.id],
  }),
}))
