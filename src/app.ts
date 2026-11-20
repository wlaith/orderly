import express from 'express'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { config } from './config.js'
import type { Db } from './db.js'
import { apiRoutes } from './routes/api.js'
import { authRoutes } from './routes/auth.js'

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export function createApp(db: Db) {
  const app = express()
  app.disable('x-powered-by')
  // One hop: req.ip is the real client. "true" would trust a spoofable X-Forwarded-For.
  if (config.trustProxy) app.set('trust proxy', 1)

  app.use((_req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'DENY' })
    next()
  })
  app.get('/healthz', (_req, res) => { db.prepare('select 1').get(); res.type('text').send('ok') })
  app.use('/static', express.static(here('../public'), { maxAge: config.production ? '1h' : 0 }))
  const dist = here('../web/dist')
  app.use(express.static(dist, { index: false, maxAge: config.production ? '1h' : 0 }))
  app.use(express.urlencoded({ extended: false, limit: '20kb' }))
  app.use(express.json({ limit: '20kb' }))

  app.use(authRoutes(db))
  app.use('/api', apiRoutes(db))

  app.get(['/', '/new', '/dashboard', '/t/:token', '/:slug'], (_req, res, next) => {
    if (!existsSync(`${dist}/index.html`)) return void res.status(503).type('text').send('Front end not built. Run: npm run build:web')
    res.sendFile(`${dist}/index.html`, (err) => err && next(err))
  })

  app.use((_req, res) => res.status(404).type('text').send('Not found'))
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err)
    res.status(500).type('text').send('Something went wrong.')
  })
  return app
}
