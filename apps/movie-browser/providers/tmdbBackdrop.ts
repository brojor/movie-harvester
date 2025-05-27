import type { ProviderGetImage } from '@nuxt/image'
import { joinURL } from 'ufo'

const baseURL = 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces'

export const getImage: ProviderGetImage = (src) => {
  return { url: joinURL(baseURL, src) }
}
