import { webshareApi } from '@repo/shared'

export default defineEventHandler(async (event) => {
  const { ident } = await readBody<{ ident: string }>(event)

  const exists = await webshareApi.fileExists(ident)

  return { exists }
})
