import { cwd } from 'node:process'
import { pathToFileURL } from 'node:url'
import { Env } from '@adonisjs/env'

// eslint-disable-next-line antfu/no-top-level-await
const env = await Env.create(pathToFileURL(cwd()), {
  DATABASE_URL: Env.schema.string(),
})

export { env }
