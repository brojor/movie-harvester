import type { ProviderGetImage } from '@nuxt/image'
import { joinURL } from 'ufo'

const baseURL = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2'

export const getImage: ProviderGetImage = (src) => {
  return { url: joinURL(baseURL, src) }
}
