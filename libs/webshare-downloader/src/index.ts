import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { extractFilename, extractIdent, webshareApi } from '@repo/shared'
import axios from 'axios'
import { crypt as md5crypt } from 'crypt3-md5'
import ipc from 'node-ipc'
import progress from 'progress-stream'

export interface WebshareConfig {
  username: string
  password: string
  downloadDir: string
}

ipc.config.silent = true
ipc.connectTo('nuxt-ws')

async function login(user: string, pass: string): Promise<void> {
  const salt = await webshareApi.getSalt(user)
  const password = passwordDigest(pass, salt)
  const token = await webshareApi.login(user, password)

  webshareApi.setCookie(token)
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

export function createWebshareDownloader(config: WebshareConfig): {
  downloadFile: (fileUrl: string) => Promise<void>
} {
  return {
    downloadFile: async (fileUrl: string): Promise<void> => {
      if (!webshareApi.isLoggedIn()) {
        await login(config.username, config.password)
      }

      const ident = extractIdent(fileUrl)
      const fileLink = await webshareApi.getFileLink(ident)
      const filename = extractFilename(fileLink)
      const filePath = path.join(config.downloadDir, filename)
      const writer = fs.createWriteStream(filePath)

      const { data: dataStream, headers } = await axios.get(fileLink, { responseType: 'stream' })

      const contentLength = Number(headers['content-length'] ?? 0)
      const progressStream = progress({ length: contentLength, time: 100 })

      progressStream.on('progress', (progress) => {
        const payload = {
          id: filename,
          speed: progress.speed,
          transferred: progress.transferred,
          percentage: progress.percentage,
        }

        ipc.of['nuxt-ws']?.emit('progress', JSON.stringify(payload))
      })

      return new Promise<void>((resolve, reject) => {
        writer.on('finish', () => {
          resolve()
        })

        writer.on('error', (error: Error) => {
          reject(error)
        })

        dataStream.on('error', (error: Error) => {
          reject(error)
        })

        dataStream.pipe(progressStream).pipe(writer)
      })
    },
  }
}

// Legacy export for backward compatibility
export async function downloadFile(_fileUrl: string): Promise<void> {
  throw new Error('downloadFile is deprecated. Use createWebshareDownloader() instead.')
}
