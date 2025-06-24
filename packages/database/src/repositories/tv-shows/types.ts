import type { CsfdTvShowDetails } from '@repo/csfd-scraper'
import type { RtDetails } from '@repo/rt-scraper'
import type { TmdbTvShowDetails } from '@repo/tmdb-fetcher'
import type { TopicType, TvShow } from '@repo/types'
import type { TvShowRecord } from '../../types.js'

export interface TvShowRepository {
  addTvShow: (tvShow: TvShow) => Promise<TvShowRecord>
  setCsfdId: (tvShowId: number, csfdId: number) => Promise<void>
  setTmdbId: (tvShowId: number, tmdbId: number) => Promise<void>
  setRtId: (tvShowId: number, rtId: string) => Promise<void>
  getLastUpdateDate: () => Promise<Date>
}

export interface TvShowTopicsRepository {
  setTvShowTopicSource: (tvShowId: number, languages: string[], topicId: number, sourceType: TopicType) => Promise<void>
}

export interface CsfdTvShowDataRepository {
  save: (tvShowDetails: CsfdTvShowDetails) => Promise<number>
}

export interface RtTvShowDataRepository {
  save: (tvShowDetails: RtDetails) => Promise<string>
}

export interface TmdbTvShowDataRepository {
  save: (tvShowDetails: TmdbTvShowDetails) => Promise<number>
}
