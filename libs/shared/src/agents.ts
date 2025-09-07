import type { Agent as HttpAgent } from 'node:http'
import type { Agent as HttpsAgent } from 'node:https'
import type { Cookie } from 'tough-cookie'
import type { WarforumAgentOpts } from './types.js'
import { HttpCookieAgent, HttpsCookieAgent } from 'http-cookie-agent/http'
import { serialize } from 'php-serialize'
import { CookieJar } from 'tough-cookie'

export function createWarforumAgents(concurrency: number, opts: WarforumAgentOpts): {
  httpAgent: HttpAgent
  httpsAgent: HttpsAgent
} {
  const warforumData = buildWarforumData(opts.userId, opts.autoLoginId)
  const dataCookie = `warforum_data=${warforumData}; Path=/; Domain=.www.warforum.xyz; Max-Age=${60 * 60 * 24 * 365}`
  const sidCookie = `warforum_sid=${opts.sid}; Path=/; Domain=.www.warforum.xyz; Max-Age=Session`
  const jar = new CookieJar()

  // Filter out warforum_t cookies
  const originalSetCookie = jar.setCookie.bind(jar)
  jar.setCookie = function (cookieStr: string | Cookie, currentUrl: string | URL, options?: any, cb?: any): any {
    const cookieName = typeof cookieStr === 'string'
      ? cookieStr.split('=')[0].trim()
      : cookieStr.key

    if (cookieName === 'warforum_t') {
      cb?.(null, undefined)
      return Promise.resolve(undefined)
    }

    return originalSetCookie(cookieStr, currentUrl, options, cb)
  }

  jar.setCookie(dataCookie, opts.baseUrl)
  jar.setCookie(sidCookie, opts.baseUrl)

  const common = {
    timeout: 8000,
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
