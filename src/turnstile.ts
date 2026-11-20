import { config } from './config.js'

export async function turnstileOk(token: unknown, ip: string): Promise<boolean> {
  if (!config.turnstileSecret) return true
  if (typeof token !== 'string' || !token) return false
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: new URLSearchParams({ secret: config.turnstileSecret, response: token, remoteip: ip }),
    })
    return ((await res.json()) as { success?: boolean }).success === true
  } catch {
    return false
  }
}
