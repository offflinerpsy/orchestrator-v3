import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET() {
  try {
    const { stdout, stderr } = await execAsync(
      'nssm status OrchestratorAdminPanel',
      { timeout: 5000 }
    )

    const output = (stdout || stderr).trim()
    const running = output === 'SERVICE_RUNNING'

    return NextResponse.json({
      ok: true,
      service: 'AdminPanel',
      running,
      status: output,
    })
  } catch (error: any) {
    const message = error.message || String(error)
    const notInstalled = message.includes('does not exist')

    return NextResponse.json({
      ok: !notInstalled,
      service: 'AdminPanel',
      running: false,
      status: notInstalled ? 'NOT_INSTALLED' : 'ERROR',
      error: notInstalled ? undefined : message,
    })
  }
}
