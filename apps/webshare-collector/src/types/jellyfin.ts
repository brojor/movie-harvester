export interface JellyfinResponse {
  Items: Item[]
  TotalRecordCount: number
  StartIndex: number
}

export interface Item {
  Name: string
  ServerId: string
  Id: string
  HasSubtitles: boolean
  Container: string
  PremiereDate: string
  CriticRating: number
  OfficialRating: string
  ChannelId: any
  CommunityRating: number
  RunTimeTicks: number
  ProductionYear: number
  ProviderIds: ProviderIds
  IsFolder: boolean
  Type: string
  VideoType: string
  ImageTags: ImageTags
  BackdropImageTags: string[]
  ImageBlurHashes: ImageBlurHashes
  LocationType: string
  MediaType: string
}

export interface ProviderIds {
  Tmdb: string
  Imdb: string
  TmdbCollection: string
}

export interface ImageTags {
  Primary: string
  Logo?: string
  Thumb?: string
}

export interface ImageBlurHashes {
  Primary: string
  Backdrop?: string
  Logo?: string
  Thumb?: string
}
