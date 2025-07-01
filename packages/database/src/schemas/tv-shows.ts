import { tvShowTopicIdMap } from '@repo/shared'
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

const topicTypeValues = Object.values(tvShowTopicIdMap) as [string, ...string[]]

export const topicTypeEnum = pgEnum('tv_show_topic_type', topicTypeValues)

export const tmdbTvShowsData = pgTable('tmdb_tv_shows_data', {
  id: integer().primaryKey(),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  originalLanguage: text('original_language').notNull(),
  overview: text(),
  posterPath: text(),
  backdropPath: text(),
  firstAirDate: text(),
  episodeRunTime: integer().array(),
  numberOfEpisodes: integer('number_of_episodes'),
  numberOfSeasons: integer('number_of_seasons'),
  originCountry: text('origin_country').array(),
  languages: text('languages').array(),
  type: text(),
  popularity: real('popularity'),
  voteAverage: real('vote_average'),
  voteCount: integer('vote_count'),
  ...timestamps,
})

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

export const csfdTvShowData = pgTable('csfd_tv_show_data', {
  id: integer().primaryKey(),
  title: text(),
  originalTitle: text(),
  releaseYear: integer('release_year'),
  runtime: integer(),
  voteAverage: integer(),
  voteCount: integer(),
  posterPath: text(),
  overview: text(),
  ...timestamps,
})

export const csfdTvShowsToGenres = pgTable(
  'csfd_tv_shows_to_genres',
  {
    csfdId: integer('csfd_id').notNull().references(() => csfdTvShowData.id),
    genreId: integer('genre_id').notNull().references(() => csfdGenres.id),
  },
  t => [primaryKey({ columns: [t.csfdId, t.genreId] })],
)

export const rtTvShowData = pgTable('rt_tv_show_data', {
  id: text().primaryKey(),
  criticsScore: integer(),
  criticsReviews: integer(),
  audienceScore: integer(),
  audienceReviews: integer(),
  ...timestamps,
})

export const tvShows = pgTable('tv_shows', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  czechTitle: text(),
  originalTitle: text().notNull().unique(),
  tmdbId: integer(),
  csfdId: integer(),
  rtId: text(),
  ...timestamps,
})

export const tvShowTopics = pgTable('tv_show_topics', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  tvShowId: integer('tv_show_id').notNull().references(() => tvShows.id),
  topicId: integer('topic_id').notNull(),
  topicType: topicTypeEnum().notNull(),
  languages: text('languages').array().notNull(),
  ...timestamps,
}, table => [
  uniqueIndex('unique_tv_show_topic_type').on(table.tvShowId, table.topicType, table.languages),
])

export const tvShowsRelations = relations(tvShows, ({ one, many }) => ({
  topics: many(tvShowTopics),
  tmdbData: one(tmdbTvShowsData, {
    fields: [tvShows.tmdbId],
    references: [tmdbTvShowsData.id],
  }),
  csfdData: one(csfdTvShowData, {
    fields: [tvShows.csfdId],
    references: [csfdTvShowData.id],
  }),
  rtData: one(rtTvShowData, {
    fields: [tvShows.rtId],
    references: [rtTvShowData.id],
  }),
}))

export const tvShowTopicsRelations = relations(tvShowTopics, ({ one }) => ({
  tvShow: one(tvShows, {
    fields: [tvShowTopics.tvShowId],
    references: [tvShows.id],
  }),
}))

export const tmdbTvShowsDataRelations = relations(tmdbTvShowsData, ({ one, many }) => ({
  tvShow: one(tvShows, {
    fields: [tmdbTvShowsData.id],
    references: [tvShows.tmdbId],
  }),
  genres: many(tmdbTvShowsToGenres),
  networks: many(tmdbTvShowToNetworks),
  seasons: many(tmdbSeasons),
}))

export const csfdTvShowDataRelations = relations(csfdTvShowData, ({ one, many }) => ({
  tvShow: one(tvShows, {
    fields: [csfdTvShowData.id],
    references: [tvShows.csfdId],
  }),
  genres: many(csfdTvShowsToGenres),
}))

export const rtTvShowDataRelations = relations(rtTvShowData, ({ one }) => ({
  tvShow: one(tvShows, {
    fields: [rtTvShowData.id],
    references: [tvShows.rtId],
  }),
}))

export const tmdbTvShowGenresRelations = relations(tmdbTvShowGenres, ({ many }) => ({
  tmdbTvShowsData: many(tmdbTvShowsToGenres),
}))

export const csfdGenresRelations = relations(csfdGenres, ({ many }) => ({
  tvShows: many(csfdTvShowsToGenres),
}))

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

export const csfdTvShowsToGenresRelations = relations(csfdTvShowsToGenres, ({ one }) => ({
  tvShow: one(csfdTvShowData, {
    fields: [csfdTvShowsToGenres.csfdId],
    references: [csfdTvShowData.id],
  }),
  genre: one(csfdGenres, {
    fields: [csfdTvShowsToGenres.genreId],
    references: [csfdGenres.id],
  }),
}))

export const tmdbNetworksRelations = relations(tmdbNetworks, ({ many }) => ({
  tmdbTvShowsData: many(tmdbTvShowToNetworks),
}))

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

export const tmdbSeasonsRelations = relations(tmdbSeasons, ({ one }) => ({
  tvShow: one(tmdbTvShowsData, {
    fields: [tmdbSeasons.tvShowId],
    references: [tmdbTvShowsData.id],
  }),
}))
