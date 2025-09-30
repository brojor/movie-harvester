import type { CancelTokenSource } from 'axios'
import type { Progress } from 'progress-stream'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { extractFilename, extractIdent, webshareApi } from '@repo/shared'
import axios from 'axios'
import { crypt as md5crypt } from 'crypt3-md5'
import progress from 'progress-stream'

export interface ProgressData extends Progress {
  status: 'active' | 'paused'
}

interface DownloadManagerOptions {
  onProgress?: (progress: Progress) => void
  updateData?: (data: any) => void
  username: string
  password: string
  downloadDir: string
}

// Přihlášení k Webshare
async function login(user: string, pass: string): Promise<void> {
  const salt = await webshareApi.getSalt(user)
  const password = passwordDigest(pass, salt)
  const token = await webshareApi.login(user, password)
  webshareApi.setCookie(token)
}

function passwordDigest(password: string, salt: string): string {
  const md5Salt = salt.startsWith('$1$') ? salt : `$1$${salt}$`
  const cryptString = md5crypt(password, md5Salt)
  return createHash('sha1').update(cryptString).digest('hex')
}

export class DownloadManager {
  private cancelTokenSource: CancelTokenSource | null = null
  private paused = false
  private downloadedBytes = 0
  private filePath = ''
  private currentProgress: Progress = {
    percentage: 0,
    transferred: 0,
    length: 0,
    remaining: 0,
    eta: 0,
    runtime: 0,
    delta: 0,
    speed: 0,
  }

  constructor(private options: DownloadManagerOptions) {}

  async start(fileUrl: string, _jobId: string): Promise<{ status: 'finished' | 'paused' | 'canceled' }> {
    // Login pokud nejsme přihlášeni
    if (!webshareApi.isLoggedIn()) {
      await login(this.options.username, this.options.password)
    }

    // Získání odkazu a názvu souboru
    const ident = extractIdent(fileUrl)
    const fileLink = await webshareApi.getFileLink(ident)
    const filename = extractFilename(fileLink)
    this.filePath = path.join(this.options.downloadDir, filename)

    // Kontrola existujícího souboru
    if (fs.existsSync(this.filePath)) {
      this.downloadedBytes = fs.statSync(this.filePath).size
    }

    // Získání informací o souboru
    console.log('fileLink', fileLink)
    const { headers } = await axios.head(fileLink)
    const expectedSize = Number(headers['content-length'] ?? 0)
    const lastModified = headers['last-modified'] ?? ''

    this.options.updateData?.({
      expectedSize,
      lastModified,
      filename,
      url: fileUrl,
    })

    // Stahování
    try {
      await this.download(fileLink, expectedSize)
      return { status: 'finished' }
    }
    catch (error) {
      if (axios.isCancel(error)) {
        return { status: this.paused ? 'paused' : 'canceled' }
      }
      throw error
    }
  }

  private async download(fileLink: string, totalSize: number): Promise<void> {
    this.cancelTokenSource = axios.CancelToken.source()

    const headers: Record<string, string> = {}
    if (this.downloadedBytes > 0) {
      headers.Range = `bytes=${this.downloadedBytes}-`
    }

    const { data: dataStream } = await axios.get(fileLink, {
      responseType: 'stream',
      headers,
      cancelToken: this.cancelTokenSource.token,
    })

    const totalBytes = totalSize + this.downloadedBytes
    const writer = fs.createWriteStream(this.filePath, { flags: this.downloadedBytes > 0 ? 'a' : 'w' })
    const progressStream = progress({ length: totalBytes, time: 100, transferred: this.downloadedBytes })

    progressStream.on('progress', (p: Progress) => {
      this.options.onProgress?.(p)
    })

    return new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
      dataStream.on('error', reject)
      dataStream.pipe(progressStream).pipe(writer)
    })
  }

  pause(): void {
    if (this.cancelTokenSource && !this.paused) {
      this.cancelTokenSource.cancel('Download paused')
      this.paused = true
    }
  }

  cancel(): void {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Download canceled')
    }
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath)
    }
  }
}
