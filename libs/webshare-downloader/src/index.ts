import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { env } from '@repo/shared'
import axios from 'axios'
import { crypt as md5crypt } from 'crypt3-md5'
import progress from 'progress-stream'
import api from './api.js'
import { extractFilename, extractIdent } from './url.js'

async function login(user: string, pass: string): Promise<void> {
  const salt = await api.getSalt(user)
  const password = passwordDigest(pass, salt)
  const token = await api.login(user, password)

  api.setCookie(token)
}

function passwordDigest(password: string, salt: string): string {
  // Format the salt to the correct format "$1$salt$"
  const md5Salt = salt.startsWith('$1$') ? salt : `$1$${salt}$`

  // MD5-Crypt (unix crypt(3) variant)
  const cryptString = md5crypt(password, md5Salt) // "$1$salt$checksum"

  // SHA-1 hex of the MD5-Crypt string
  const digest = createHash('sha1').update(cryptString).digest('hex')

  return digest
}

export async function downloadFile(fileUrl: string): Promise<void> {
  if (!api.isLoggedIn()) {
    await login(env.WEBSHARE_USERNAME, env.WEBSHARE_PASSWORD)
  }

  const ident = extractIdent(fileUrl)
  const fileLink = await api.getFileLink(ident)
  const filename = extractFilename(fileLink)
  const filePath = path.join(process.cwd(), filename)
  const writer = fs.createWriteStream(filePath)

  const { data: dataStream, headers } = await axios.get(fileLink, { responseType: 'stream' })

  const contentLength = Number(headers['content-length'] ?? 0)
  const progressStream = progress({ length: contentLength, time: 100 })

  progressStream.on('progress', (progress) => {
    console.log(progress)
  })

  dataStream.pipe(progressStream).pipe(writer)
}
