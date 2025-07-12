import type { AxiosError, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { parseStringPromise } from 'xml2js'

export type SuccessResponse<T> = {
  status: ['OK']
} & T

export interface ErrorResponse {
  status: ['FATAL']
  code: [string]
  message: [string]
}

export interface ApiResponse<T> {
  response: SuccessResponse<T> | ErrorResponse
}

export interface Credentials {
  username: string
  password: string
}

const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 250

const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

const api = axios.create({
  baseURL: 'https://webshare.cz',
  headers: {
    'Accept': 'text/xml',
    'Content-Type': 'application/x-www-form-urlencoded',
  },
})

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const config = error.config as AxiosRequestConfig & { _retry?: number }

    if (error.response?.status === 403) {
      config._retry = (config._retry || 0) + 1

      if (config._retry <= MAX_RETRIES) {
        const delayMs = INITIAL_DELAY_MS * 2 ** (config._retry - 1)
        await delay(delayMs)

        return api(config)
      }
    }

    return Promise.reject(error)
  },
)

function handleResponse<T>(response: SuccessResponse<T> | ErrorResponse): SuccessResponse<T> {
  if (response.status[0] === 'OK') {
    return response as SuccessResponse<T>
  }
  throw new Error(`${(response as ErrorResponse).code[0]}: ${(response as ErrorResponse).message[0]}`)
}

/**
 * @param endpoint The endpoint of the API.
 * @param params The parameters of the request.
 * @returns The response of the API. If the response is an error, an error is thrown.
 */
async function makeRequest<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const { data } = await api.post(endpoint, new URLSearchParams(params))
  const { response } = await parseStringPromise(data) as ApiResponse<T>
  const successResponse = handleResponse<T>(response)
  return successResponse
}

/**
 * @param usernameOrEmail The username or email address of the user.
 * @param password The user's password digest SHA1(MD5_CRYPT(password)).
 * @returns A session security token (WST).
 */
export async function login(usernameOrEmail: string, password: string): Promise<string> {
  const response = await makeRequest<{ token: [string] }>('/api/login/', {
    username_or_email: usernameOrEmail,
    password,
    keep_logged_in: '1',
  })
  return response.token[0]
}

/**
 * @param ident The identifier of the file.
 * @returns A direct download link of the given file.
 */
export async function getFileLink(ident: string): Promise<string> {
  const response = await makeRequest<{ link: [string] }>('/api/file_link/', {
    ident,
    force_https: '1',
  })
  return response.link[0]
}

/**
 * @param usernameOrEmail The username or email address of the user.
 * @returns The given user's password salt.
 */
export async function getSalt(usernameOrEmail: string): Promise<string> {
  const response = await makeRequest<{ salt: [string] }>('/api/salt/', {
    username_or_email: usernameOrEmail,
  })
  return response.salt[0]
}

/**
 * @param ident The identifier of the file.
 * @returns Whether the given file exists.
 */
export async function fileExists(ident: string): Promise<boolean> {
  const response = await makeRequest<{ exists: ['1' | '0'] }>(
    '/api/file_exists/',
    {
      ident,
    },
  )
  return response.exists[0] === '1'
}

/**
 * @param token The session security token (WST).
 */
export function setCookie(token: string): void {
  api.defaults.headers.Cookie = `WST=${token}`
}

/**
 * @returns Whether the user is logged in.
 */
export function isLoggedIn(): boolean {
  return !!api.defaults.headers.Cookie
}

export default { getFileLink, getSalt, login, setCookie, isLoggedIn, fileExists }
