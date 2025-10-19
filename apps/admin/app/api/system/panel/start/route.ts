import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST() {
  try {
    const { stdout, stderr } = await execAsync(
      'nssm start OrchestratorAdminPanel',
      { timeout: 10000 }
    )

    return NextResponse.json({
      ok: true,
      action: 'start',
      service: 'AdminPanel',
      output: stdout || stderr,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        action: 'start',
        service: 'AdminPanel',
        error: error.message || String(error),
      },
      { status: 500 }
    )
  }
}
