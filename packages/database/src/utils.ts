import type { DataTable, SourceTable } from '@repo/types'
import { desc } from 'drizzle-orm'
import { db } from './index.js'

/**
 * Get the last processed date from a given table
 * @param table - Drizzle table with a createdAt column
 * @returns The last processed date or new Date(0) if no records exist
 */
export async function getLastProcessedDate(table: DataTable | SourceTable): Promise<Date> {
  const lastRecord = await db
    .select()
    .from(table)
    .orderBy(desc(table.createdAt))
    .limit(1)

  return lastRecord?.[0]?.createdAt || new Date(0)
}
