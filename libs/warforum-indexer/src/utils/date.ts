import { env } from '@repo/shared'
import { isBefore, isValid, parse } from 'date-fns'
import { cs } from 'date-fns/locale'

export function parseDate(raw: string): Date {
  const parsed = parse(raw.trim(), 'dd MMMM yyyy, HH:mm', new Date(), { locale: cs })
  if (!isValid(parsed)) {
    throw new Error(`Invalid date string: "${raw}"`)
  }
  return parsed
}

export function isOld(date: Date, cutoffDate?: Date): boolean {
  const isDeprecated = isBefore(date, new Date(env.WARFORUM_INDEXER_DEPRECATED_DATE))
  const isBeforeCutoffDate = cutoffDate ? isBefore(cutoffDate, date) : false

  return isDeprecated || isBeforeCutoffDate
}
