import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync(
      'nssm stop OrchestratorAdminPanel',
      { timeout: 10000 }
    )

    return NextResponse.json({
      ok: true,
      action: 'stop',
      service: 'AdminPanel',
      output: stdout || stderr,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: 'stop',
        service: 'AdminPanel',
        error: error.message || String(error),
      },
      { status: 500 }
    )
  }
}
