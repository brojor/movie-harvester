import type { Agent as HttpAgent } from 'node:http'
import type { Agent as HttpsAgent } from 'node:https'
import { HttpCookieAgent, HttpsCookieAgent } from 'http-cookie-agent/http'
import { serialize } from 'php-serialize'
import { CookieJar } from 'tough-cookie'
import { env } from './env.js'

export async function makeAgents(concurrency: number): Promise<{
  httpAgent: HttpAgent
  httpsAgent: HttpsAgent
}> {
  const warforumData = buildWarforumData(env.WARFORUM_USER_ID, env.WARFORUM_AUTO_LOGIN_ID)
  const cookie = `warforum_data=${warforumData};`
  const jar = new CookieJar()
  jar.setCookie(cookie, 'https://warforum.xyz')

  const common = {
    timeout: 8000, // kill hung socket
    cookies: { jar },
    keepAlive: true,
    maxSockets: concurrency + 1,
    maxFreeSockets: 1,
    keepAliveMsecs: 5000,
    freeSocketTimeout: 5000,
  } as const

  return {
    httpAgent: new HttpCookieAgent(common),
    httpsAgent: new HttpsCookieAgent(common),
  }
}

export function buildWarforumData(userId: number, autoLoginId: string): string {
  const payload = { autologinid: autoLoginId, userid: String(userId) }
  return encodeURIComponent(serialize(payload))
}
