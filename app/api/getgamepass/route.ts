import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
  }

  const url = `https://apis.roblox.com/game-passes/v1/users/${userId}/game-passes?count=100`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error("Failed to fetch gamepasses")

    const json = await res.json()
    return NextResponse.json(json)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
