import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
	try {
		const r = await fetch('http://127.0.0.1:8188/system_stats', { signal: AbortSignal.timeout(3000), cache: 'no-store' as RequestCache });
		if (!r.ok) return NextResponse.json({ online: false });
		const stats = await r.json();
		return NextResponse.json({ online: true, stats });
	} catch {
		return NextResponse.json({ online: false })
	}
}
