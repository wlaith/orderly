import nodemailer, { type Transporter } from 'nodemailer'
import { config } from './config.js'

let transport: Transporter | undefined

export const emailConfigured = () => Boolean(config.smtpUrl && config.emailFrom)

export async function sendSignInLink(to: string, link: string): Promise<void> {
  if (!emailConfigured()) {
    if (config.production) throw new Error('Email sign-in is not configured: set SMTP_URL and EMAIL_FROM.')
    console.log(`Sign-in link for ${to} (not emailed, no SMTP_URL set): ${link}`)
    return
  }
  transport ??= nodemailer.createTransport(config.smtpUrl)
  await transport.sendMail({
    from: config.emailFrom,
    to,
    subject: 'Your Orderly sign-in link',
    text: `Sign in to Orderly:\n\n${link}\n\nThe link works once and expires in 15 minutes. If you did not ask for it, ignore this email.`,
  })
}
