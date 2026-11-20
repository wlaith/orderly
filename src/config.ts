const env = process.env

export const config = {
  port: Number(env.PORT ?? 3000),
  baseUrl: (env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  dbPath: env.DB_PATH ?? './data/doorin.db',
  sessionSecret: env.SESSION_SECRET ?? '',
  production: env.NODE_ENV === 'production',
  devLogin: env.DEV_LOGIN === '1',
  googleId: env.GOOGLE_CLIENT_ID ?? '',
  googleSecret: env.GOOGLE_CLIENT_SECRET ?? '',
  turnstileSite: env.TURNSTILE_SITE_KEY ?? '',
  turnstileSecret: env.TURNSTILE_SECRET_KEY ?? '',
  trustProxy: env.TRUST_PROXY === '1',
  smtpUrl: env.SMTP_URL ?? '',
  emailFrom: env.EMAIL_FROM ?? '',
}

if (config.production) {
  if (config.sessionSecret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters in production. Generate one with: openssl rand -hex 32')
  if (config.devLogin) throw new Error('DEV_LOGIN=1 is not allowed in production.')
} else if (!config.sessionSecret) {
  config.sessionSecret = 'dev-only-secret-change-me'
}
