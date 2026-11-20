import Database from 'better-sqlite3'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const SCHEMA = `
create table if not exists hosts (
  id          integer primary key,
  google_sub  text unique,
  email       text,
  name        text not null,
  about       text not null default '',
  slug        text not null unique,
  ticket_color text,
  ticket_ink   text,
  created_at  text not null default (datetime('now'))
);

create table if not exists login_links (
  token_hash  blob primary key,
  email       text not null,
  expires_at  integer not null,
  used_at     integer
);

create table if not exists tickets (
  id            integer primary key,
  host_id       integer not null references hosts(id) on delete cascade,
  token_hash    blob not null unique,
  name          text not null,
  topic         text not null,
  link          text,
  contact_kind  text not null check (contact_kind in ('whatsapp','signal','telegram','phone','email')),
  contact       text not null,
  status        text not null default 'waiting' check (status in ('waiting','done','left')),
  reached_at    text,
  created_at    text not null default (datetime('now')),
  closed_at     text
);
create index if not exists tickets_line on tickets (host_id, status, id);
`

export type Db = Database.Database

export function openDb(path: string): Db {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true })
  const db = new Database(path)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.exec(SCHEMA)
  const cols = new Set((db.prepare('pragma table_info(hosts)').all() as { name: string }[]).map((c) => c.name))
  for (const c of ['ticket_color', 'ticket_ink', 'email']) if (!cols.has(c)) db.exec(`alter table hosts add column ${c} text`)
  db.exec('create unique index if not exists hosts_email on hosts (email)')
  return db
}
