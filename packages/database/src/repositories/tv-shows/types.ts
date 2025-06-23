import type { CsfdTvShowDetails } from '@repo/csfd-scraper'
import type { RtDetails } from '@repo/rt-scraper'
import type { TopicType, TvShow } from '@repo/types'

export interface TvShowRepository {
  addTvShow: (tvShow: TvShow) => Promise<number>
  setCsfdId: (tvShowId: number, csfdId: number) => Promise<void>
  setTmdbId: (tvShowId: number, tmdbId: number) => Promise<void>
  setRtId: (tvShowId: number, rtId: string) => Promise<void>
}

export interface TvShowTopicsRepository {
  setTvShowTopicSource: (tvShowId: number, topicId: number, sourceType: TopicType) => Promise<void>
}

export interface CsfdTvShowDataRepository {
  save: (tvShowDetails: CsfdTvShowDetails) => Promise<number>
}

export interface RtTvShowDataRepository {
  save: (tvShowDetails: RtDetails) => Promise<string>
}
