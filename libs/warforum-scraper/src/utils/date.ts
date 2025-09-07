import { isBefore, isValid, parse } from 'date-fns'
import { cs } from 'date-fns/locale'

export function parseDate(raw: string): Date | null {
  const parsed = parse(raw.trim(), 'dd MMMM yyyy, HH:mm', new Date(), { locale: cs })
  if (!isValid(parsed)) {
    console.error(`Invalid date string: "${raw}"`)
    return null
  }
  return parsed
}

export function isOld(date: Date, deprecatedDate: string, cutoffDate?: Date): boolean {
  const isDeprecated = isBefore(date, new Date(deprecatedDate))
  const isBeforeCutoffDate = cutoffDate ? isBefore(date, cutoffDate) : false

  return isDeprecated || isBeforeCutoffDate
}
