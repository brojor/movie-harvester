import type { Cheerio, CheerioAPI } from 'cheerio'
import type { Element as DomElement } from 'domhandler'
import { extractTopicId } from './parsing.js'

export function extractTopicRows($: CheerioAPI): Cheerio<DomElement> {
  const rows = $('table.forumline:nth-child(1) tr').filter((_, row) => {
    const cells = $(row).children('td')

    if (cells.length !== 5)
      return false // header/footer

    const maybePinned = cells.eq(1).children().eq(0).text().trim()
    return maybePinned !== 'Důležité:' // skip pinned topics
  })

  return rows
}

export function parseTopicTitle(row: DomElement, $: CheerioAPI): string | null {
  const title = $(row).find('a.topictitle').text().trim()
  if (!title)
    return null

  return title
}

export function parseTopicId(row: DomElement, $: CheerioAPI): number | null {
  const href = $(row).find('a.topictitle').attr('href')
  if (!href)
    return null

  return extractTopicId(href)
}
