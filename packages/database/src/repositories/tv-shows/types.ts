import type { TopicType } from '@repo/shared'
import type { CsfdTvShowDetails, RtDetails, TmdbTvShowDetails, TvShow } from '@repo/types'
import type { TvShowRecord } from '../../types.js'

export interface TvShowRepository {
  firstOrCreate: (tvShow: TvShow) => Promise<TvShowRecord>
  setCsfdId: (tvShowId: number, csfdId: number) => Promise<void>
  setTmdbId: (tvShowId: number, tmdbId: number) => Promise<void>
  setRtId: (tvShowId: number, rtId: string) => Promise<void>
  getLastUpdateDate: () => Promise<Date>
}

export interface TvShowTopicsRepository {
  setTvShowTopicSource: (tvShowId: number, languages: string[], topicId: number, topicType: TopicType) => Promise<void>
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
