import type { ProviderGetImage } from '@nuxt/image'
import { joinURL } from 'ufo'

const baseURL = 'https://media.themoviedb.org/t/p/h60'

export const getImage: ProviderGetImage = (src) => {
  return { url: joinURL(baseURL, src) }
}
