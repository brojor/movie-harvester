import { isBefore, isValid, parse, sub } from 'date-fns'
import { cs } from 'date-fns/locale'

export function parseDate(raw: string): Date {
  const parsed = parse(raw.trim(), 'dd MMMM yyyy, HH:mm', new Date(), { locale: cs })
  if (!isValid(parsed)) {
    throw new Error(`Invalid date string: "${raw}"`)
  }
  return parsed
}

export function isOld(date: Date, months = 6): boolean {
  return isBefore(date, sub(new Date(), { months }))
}
