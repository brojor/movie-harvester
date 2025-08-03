import type { CancelTokenSource } from 'axios'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { env, extractFilename, extractIdent, webshareApi } from '@repo/shared'
import axios from 'axios'
import { crypt as md5crypt } from 'crypt3-md5'
import ipc from 'node-ipc'
import progress from 'progress-stream'

ipc.config.silent = true

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
  private pausedResolver: (() => void) | null = null
  private pausedPromise: Promise<void> | null = null

  private downloadedBytes = 0
  private filePath!: string
  private fileLink!: string
  private filename!: string

  async start(fileUrl: string): Promise<void> {
    // Login pokud nejsme přihlášeni
    if (!webshareApi.isLoggedIn()) {
      await login(env.WEBSHARE_USERNAME, env.WEBSHARE_PASSWORD)
    }

    // Získání odkazu a názvu souboru
    const ident = extractIdent(fileUrl)
    this.fileLink = await webshareApi.getFileLink(ident)
    this.filename = extractFilename(this.fileLink)
    this.filePath = path.join(env.WEBSHARE_DOWNLOAD_DIR, this.filename)

    // Pokud existuje částečně stažený soubor, nastav offset
    if (fs.existsSync(this.filePath)) {
      this.downloadedBytes = fs.statSync(this.filePath).size
    }

    // Spuštění stahování
    await this.download()
  }

  private async download(): Promise<void> {
    this.cancelTokenSource = axios.CancelToken.source()

    const headers: Record<string, string> = {}
    if (this.downloadedBytes > 0) {
      headers.Range = `bytes=${this.downloadedBytes}-`
    }

    const { data: dataStream, headers: responseHeaders } = await axios.get(this.fileLink, {
      responseType: 'stream',
      headers,
      cancelToken: this.cancelTokenSource.token,
    })

    const totalBytes = Number(responseHeaders['content-length'] ?? 0) + this.downloadedBytes
    const writer = fs.createWriteStream(this.filePath, { flags: this.downloadedBytes > 0 ? 'a' : 'w' })
    const progressStream = progress({ length: totalBytes, time: 100 })

    // Reportování progresu přes IPC
    progressStream.on('progress', (p) => {
      ipc.of['nuxt-ws']?.emit(
        'progress',
        JSON.stringify({
          id: this.filename,
          speed: p.speed,
          transferred: p.transferred,
          percentage: p.percentage,
        }),
      )
      this.downloadedBytes = p.transferred
    })

    return new Promise<void>((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
      dataStream.on('error', reject)

      dataStream.pipe(progressStream).pipe(writer)
    })
  }

  // Pauza
  pause(): void {
    if (this.cancelTokenSource && !this.paused) {
      this.cancelTokenSource.cancel('Download paused')
      this.paused = true
      this.pausedPromise = new Promise<void>(res => (this.pausedResolver = res))
    }
  }

  // Obnova
  async resume(): Promise<void> {
    if (this.paused) {
      this.paused = false
      this.pausedResolver?.()
      await this.download()
    }
  }

  // Zrušení (ukončí stahování a smaže částečný soubor)
  cancel(): void {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel('Download canceled')
    }
    if (fs.existsSync(this.filePath)) {
      fs.unlinkSync(this.filePath)
    }
  }

  getFilename(): string {
    return this.filename
  }

  getDownloadedBytes(): number {
    return this.downloadedBytes
  }

  isPaused(): boolean {
    return this.paused
  }
}
