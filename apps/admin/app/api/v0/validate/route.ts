/**
 * v0.dev validation endpoint
 * TODO: implement proper validation logic
 */

export async function POST(request: Request) {
  return Response.json({ valid: true }, { status: 200 })
}
