import { parseURL } from 'ufo'

/**
 * @param webshareFileUrl The URL of the file.
 * @returns The identifier of the file.
 */
export function extractIdent(webshareFileUrl: string): string {
  const match = webshareFileUrl.match(/file\/([^/]+)/)
  if (!match)
    throw new Error('Could not extract identifier from URL')

  return match[1]
}

/**
 * @param downloadLink A direct download link of the given file.
 * @returns The filename of the file.
 */
export function extractFilename(downloadLink: string): string {
  const { pathname } = parseURL(downloadLink)
  const filename = pathname?.split('/').pop()
  if (!filename) {
    throw new Error('Could not extract filename from download link')
  }

  return filename
}
