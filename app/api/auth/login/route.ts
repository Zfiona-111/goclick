import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Password login is no longer supported. Use /api/auth/send-otp instead.' }, { status: 410 })
}
