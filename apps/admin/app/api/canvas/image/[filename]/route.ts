import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  segmentData: { params: Promise<{ filename: string }> }
) {
  try {
    const dropOut = 'F:\\Drop\\out'; // Could read from paths.json
    const { filename } = await segmentData.params;
    
    // Security: prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const filePath = path.join(dropOut, filename);
    
    // Check file exists
    await fs.access(filePath);
    
    // Read file
    const fileBuffer = await fs.readFile(filePath);
    
    // Determine content type
    const ext = path.extname(filename).toLowerCase();
    const contentType = 
      ext === '.png' ? 'image/png' :
      ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
      ext === '.webp' ? 'image/webp' :
      'application/octet-stream';

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'File not found', details: error.message },
      { status: 404 }
    );
  }
}
