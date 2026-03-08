import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Registration is no longer separate. Use /api/auth/send-otp instead.' }, { status: 410 })
}
