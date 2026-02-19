import { join } from 'node:path'

// Simple static file server for Vite SPA builds.
// - Serves /dist assets
// - SPA fallback to index.html
// - Avoids needing nginx in Docker (useful when Docker Hub pulls time out)

const distDir = process.env.DIST_DIR || '/app/dist'
const port = Number(process.env.PORT || 80)

function safePath(urlPath: string) {
  const decoded = decodeURIComponent(urlPath.split('?')[0] || '/')
  const cleaned = decoded.replace(/\0/g, '')
  const relative = cleaned.replace(/^\/+/, '')
  return join(distDir, relative)
}

const indexFile = Bun.file(join(distDir, 'index.html'))

Bun.serve({
  port,
  async fetch(req) {
    const url = new URL(req.url)

    // Healthcheck
    if (url.pathname === '/healthz') {
      return new Response('ok', { status: 200 })
    }

    // Try to serve the exact file first
    const candidatePath = safePath(url.pathname)
    const file = Bun.file(candidatePath)

    if (await file.exists()) {
      return new Response(file)
    }

    // If request looks like an asset (has an extension) but wasn't found, return 404
    // so missing assets are obvious.
    if (/[.][a-zA-Z0-9]+$/.test(url.pathname)) {
      return new Response('Not found', { status: 404 })
    }

    // SPA fallback
    if (await indexFile.exists()) {
      return new Response(indexFile)
    }

    return new Response('Build output not found. Did you run the build?', { status: 500 })
  },
})

// eslint-disable-next-line no-console
console.log(`[web] serving ${distDir} on :${port}`)
