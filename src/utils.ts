/**
 * Original source:
 * https://github.com/unjs/nitro/blob/3cb566ea6add2977450e24b2f990945f5ddbd380/src/runtime/utils.lambda.ts
 */
import { splitCookiesString } from 'h3'
import type { Readable } from 'node:stream'

export function toBuffer(data: ReadableStream | Readable | Uint8Array) {
  if ('pipeTo' in data && typeof data.pipeTo === 'function') {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      data
        .pipeTo(
          new WritableStream({
            write(chunk) {
              chunks.push(chunk)
            },
            close() {
              resolve(Buffer.concat(chunks))
            },
            abort(reason) {
              reject(reason)
            },
          }),
        )
        .catch(reject)
    })
  }
  if ('pipe' in data && typeof data.pipe === 'function') {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      data
        .on('data', (chunk: any) => {
          chunks.push(chunk)
        })
        .on('end', () => {
          resolve(Buffer.concat(chunks))
        })
        .on('error', reject)
    })
  }
  // @ts-ignore
  return Buffer.from(data as unknown as Uint16Array)
}

export function joinHeaders(value: number | string | string[]) {
  return Array.isArray(value) ? value.join(', ') : String(value)
}

export function normalizeCookieHeader(header: number | string | string[] = '') {
  return splitCookiesString(joinHeaders(header))
}
