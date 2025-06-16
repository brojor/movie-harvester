import type { Agent as HttpAgent } from 'node:http'
import type { Agent as HttpsAgent } from 'node:https'
import { HttpCookieAgent, HttpsCookieAgent } from 'http-cookie-agent/http'
import { serialize } from 'php-serialize'
import { CookieJar } from 'tough-cookie'
import { env } from './env.js'

export function makeAgents(concurrency: number): {
  httpAgent: HttpAgent
  httpsAgent: HttpsAgent
} {
  const warforumData = buildWarforumData(env.WARFORUM_USER_ID, env.WARFORUM_AUTO_LOGIN_ID)
  const dataCookie = `warforum_data=${warforumData}; Path=/; Domain=.www.warforum.xyz; Max-Age=${60 * 60 * 24 * 365}`
  const sidCookie = `warforum_sid=${env.WARFORUM_SID}; Path=/; Domain=.www.warforum.xyz; Max-Age=Session`
  const jar = new CookieJar()
  jar.setCookie(dataCookie, env.WARFORUM_BASE_URL)
  jar.setCookie(sidCookie, env.WARFORUM_BASE_URL)

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
  const payload = { autologinid: autoLoginId, userid: userId }
  return encodeURIComponent(serialize(payload))
}
