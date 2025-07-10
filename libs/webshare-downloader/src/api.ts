import type { ApiResponse, ErrorResponse, SuccessResponse } from './types.js'
import axios from 'axios'
import { parseStringPromise } from 'xml2js'

const api = axios.create({
  baseURL: 'https://webshare.cz',
  headers: {
    'Accept': 'text/xml',
    'Content-Type': 'application/x-www-form-urlencoded',
  },
})

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
async function login(usernameOrEmail: string, password: string): Promise<string> {
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
async function getFileLink(ident: string): Promise<string> {
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
async function getSalt(usernameOrEmail: string): Promise<string> {
  const response = await makeRequest<{ salt: [string] }>('/api/salt/', {
    username_or_email: usernameOrEmail,
  })
  return response.salt[0]
}

/**
 * @param token The session security token (WST).
 */
function setCookie(token: string): void {
  api.defaults.headers.Cookie = `WST=${token}`
}

/**
 * @returns Whether the user is logged in.
 */
function isLoggedIn(): boolean {
  return !!api.defaults.headers.Cookie
}

export default { getFileLink, getSalt, login, setCookie, isLoggedIn }
