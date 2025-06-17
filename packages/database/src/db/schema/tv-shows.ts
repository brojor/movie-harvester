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

export const tvShowSources = pgTable('tv_show_sources', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  czechTitle: text(),
  originalTitle: text().notNull().unique(),
  ...timestamps,
})

export const tvShowTopics = pgTable('tv_show_topics', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tvShowId: integer('tv_show_id').notNull().references(() => tvShowSources.id),
  topicId: integer('topic_id').notNull(),
  topicType: text('topic_type').notNull(),
  languages: text('languages').notNull(),
  ...timestamps,
})

export const tmdbTvShowsData = pgTable('tmdb_tv_shows_data', {
  id: integer().primaryKey(),
  sourceId: integer('source_id').references(() => tvShowSources.id),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  originalLanguage: text('original_language').notNull(),
  overview: text(),
  posterPath: text(),
  backdropPath: text(),
  firstAirDate: text(),
  episodeRunTime: text('episode_run_time').notNull(),
  numberOfEpisodes: integer('number_of_episodes'),
  numberOfSeasons: integer('number_of_seasons'),
  originCountry: text('origin_country').notNull(),
  languages: text('languages').notNull(),
  type: text(),
  popularity: real('popularity'),
  voteAverage: real('vote_average'),
  voteCount: integer('vote_count'),
  ...timestamps,
}, table => [
  uniqueIndex('unique_tmdb_tv_show_source').on(table.sourceId),
])

export const tmdbTvShowGenres = pgTable('tmdb_tv_show_genres', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
})

export const tmdbTvShowsToGenres = pgTable('tmdb_tv_shows_to_genres', {
  tvShowId: integer('tv_show_id').references(() => tmdbTvShowsData.id),
  genreId: integer('genre_id').references(() => tmdbTvShowGenres.id),
}, t => [primaryKey({ columns: [t.tvShowId, t.genreId] })])

export const tmdbNetworks = pgTable('tmdb_networks', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  logoPath: text(),
  originCountry: text('origin_country'),
})

export const tmdbTvShowToNetworks = pgTable('tmdb_tv_show_to_networks', {
  tvShowId: integer('tv_show_id').references(() => tmdbTvShowsData.id),
  networkId: integer('network_id').references(() => tmdbNetworks.id),
}, t => [primaryKey({ columns: [t.tvShowId, t.networkId] })])

export const tmdbSeasons = pgTable('tmdb_seasons', {
  id: integer('id').primaryKey(),
  tvShowId: integer('tv_show_id').references(() => tmdbTvShowsData.id),
  name: text('name').notNull(),
  overview: text(),
  posterPath: text(),
  seasonNumber: integer('season_number').notNull(),
  voteAverage: real('vote_average'),
  episodeCount: integer('episode_count'),
  airDate: text(),
})

// CSFD
export const csfdTvShowData = pgTable('csfd_tv_show_data', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  csfdId: text('csfd_id').notNull(),
  sourceId: integer('source_id').references(() => tvShowSources.id),
  title: text(),
  originalTitle: text(),
  releaseYear: integer('release_year'),
  runtime: integer(),
  voteAverage: integer(),
  voteCount: integer(),
  posterPath: text(),
  overview: text(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_csfd_tv_show_source').on(table.sourceId),
  uniqueIndex('unique_csfd_tv_show_id').on(table.csfdId),
])

export const csfdTvShowsToGenres = pgTable(
  'csfd_tv_shows_to_genres',
  {
    csfdId: integer('csfd_id').notNull().references(() => csfdTvShowData.id),
    genreId: integer('genre_id').notNull().references(() => csfdGenres.id),
  },
  t => [primaryKey({ columns: [t.csfdId, t.genreId] })],
)

// RT
export const rtTvShowData = pgTable('rt_tv_show_data', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  rtId: text('rt_id').notNull(),
  sourceId: integer('source_id').references(() => tvShowSources.id),
  criticsScore: integer(),
  criticsReviews: integer(),
  audienceScore: integer(),
  audienceReviews: integer(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_rt_tv_show_source').on(table.sourceId),
  uniqueIndex('unique_rt_tv_show_id').on(table.rtId),
])

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
