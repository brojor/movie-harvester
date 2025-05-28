import { isBefore, parse, sub } from 'date-fns'
import { cs } from 'date-fns/locale'

export function parseDate(raw: string): Date {
  return parse(raw.trim(), 'dd MMMM yyyy, HH:mm', new Date(), { locale: cs })
}

export function isOld(date: Date): boolean {
  return isBefore(date, sub(new Date(), { months: 6 }))
}
