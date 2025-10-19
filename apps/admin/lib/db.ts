/**
 * SQLite Database Wrapper — orchestrator.db
 * Единое хранилище для jobs, messages, attachments
 * 
 * Используется:
 * - Панелью админа (очередь задач, чат)
 * - MCP сервером (инструменты для VS Code Copilot)
 * - Worker процессом (если реализован)
 */

import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

const DATA_DIR = join(process.cwd(), '../../data')
const DB_PATH = join(DATA_DIR, 'orchestrator.db')

// Создаём data/ если не существует
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true })
}

// Singleton instance
let dbInstance: Database.Database | null = null

/**
 * Получить экземпляр БД (singleton)
 */
export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH)
    dbInstance.pragma('journal_mode = WAL') // Write-Ahead Logging для производительности
    initTables(dbInstance)
  }
  return dbInstance
}

/**
 * Инициализация таблиц
 */
function initTables(db: Database.Database) {
  // Jobs table — очередь задач генерации
  db.exec(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      backend TEXT NOT NULL,
      status TEXT NOT NULL,
      prompt TEXT NOT NULL,
      params TEXT,
      result TEXT,
      createdAt TEXT NOT NULL,
      startedAt TEXT,
      finishedAt TEXT,
      progress INTEGER DEFAULT 0,
      logs TEXT
    )
  `)

  // Messages table — чат (панель + Copilot)
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      jobId TEXT,
      timestamp TEXT NOT NULL,
      FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE SET NULL
    )
  `)

  // Attachments table — файлы привязанные к сообщениям
  db.exec(`
    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      messageId TEXT NOT NULL,
      filePath TEXT NOT NULL,
      mimeType TEXT,
      FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE
    )
  `)

  // Индексы для производительности
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_createdAt ON jobs(createdAt DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_attachments_messageId ON attachments(messageId);
  `)

  console.log('[DB] Таблицы инициализированы:', DB_PATH)
}

/**
 * Job CRUD Operations
 */
export interface Job {
  id: string
  backend: 'flux' | 'sdxl' | 'sd35' | 'svd'
  status: 'created' | 'queued' | 'running' | 'done' | 'failed'
  prompt: string
  params: Record<string, any>
  result?: Record<string, any>
  createdAt: string
  startedAt?: string
  finishedAt?: string
  progress: number
  logs: string[]
}

export function createJob(job: Job) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO jobs (id, backend, status, prompt, params, result, createdAt, startedAt, finishedAt, progress, logs)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  stmt.run(
    job.id,
    job.backend,
    job.status,
    job.prompt,
    JSON.stringify(job.params),
    job.result ? JSON.stringify(job.result) : null,
    job.createdAt,
    job.startedAt || null,
    job.finishedAt || null,
    job.progress,
    JSON.stringify(job.logs || [])
  )
}

export function getJob(id: string): Job | null {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM jobs WHERE id = ?')
  const row: any = stmt.get(id)
  
  if (!row) return null
  
  return {
    ...row,
    params: JSON.parse(row.params || '{}'),
    result: row.result ? JSON.parse(row.result) : undefined,
    logs: JSON.parse(row.logs || '[]'),
  }
}

export function updateJob(id: string, updates: Partial<Job>) {
  const db = getDb()
  const fields: string[] = []
  const values: any[] = []
  
  if (updates.status) {
    fields.push('status = ?')
    values.push(updates.status)
  }
  if (updates.startedAt) {
    fields.push('startedAt = ?')
    values.push(updates.startedAt)
  }
  if (updates.finishedAt) {
    fields.push('finishedAt = ?')
    values.push(updates.finishedAt)
  }
  if (updates.progress !== undefined) {
    fields.push('progress = ?')
    values.push(updates.progress)
  }
  if (updates.result) {
    fields.push('result = ?')
    values.push(JSON.stringify(updates.result))
  }
  if (updates.logs) {
    fields.push('logs = ?')
    values.push(JSON.stringify(updates.logs))
  }
  
  if (fields.length === 0) return
  
  values.push(id)
  const stmt = db.prepare(`UPDATE jobs SET ${fields.join(', ')} WHERE id = ?`)
  stmt.run(...values)
}

export function listJobs(limit = 50, offset = 0): Job[] {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM jobs ORDER BY createdAt DESC LIMIT ? OFFSET ?')
  const rows: any[] = stmt.all(limit, offset)
  
  return rows.map((row) => ({
    ...row,
    params: JSON.parse(row.params || '{}'),
    result: row.result ? JSON.parse(row.result) : undefined,
    logs: JSON.parse(row.logs || '[]'),
  }))
}

/**
 * Message CRUD Operations
 */
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  jobId?: string
  timestamp: string
}

export function createMessage(message: Message) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO messages (id, role, content, jobId, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `)
  
  stmt.run(message.id, message.role, message.content, message.jobId || null, message.timestamp)
}

export function listMessages(limit = 100, offset = 0): Message[] {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM messages ORDER BY timestamp DESC LIMIT ? OFFSET ?')
  return stmt.all(limit, offset) as Message[]
}

/**
 * Attachment CRUD Operations
 */
export interface Attachment {
  id: string
  messageId: string
  filePath: string
  mimeType?: string
}

export function createAttachment(attachment: Attachment) {
  const db = getDb()
  const stmt = db.prepare(`
    INSERT INTO attachments (id, messageId, filePath, mimeType)
    VALUES (?, ?, ?, ?)
  `)
  
  stmt.run(attachment.id, attachment.messageId, attachment.filePath, attachment.mimeType || null)
}

export function getAttachmentsByMessage(messageId: string): Attachment[] {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM attachments WHERE messageId = ?')
  return stmt.all(messageId) as Attachment[]
}
