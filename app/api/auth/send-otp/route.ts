import { NextRequest, NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sendOtp } from '@/lib/sms'
import { checkPhoneRateLimit, checkIpRateLimit } from '@/lib/rateLimiter'

const HEADERS = { 'X-Content-Type-Options': 'nosniff' }

function isValidPhone(phone: string): boolean {
  return /^(\+?\d{7,15}|\d{11})$/.test(phone.trim())
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    const { phone } = await req.json()

    if (!phone || !isValidPhone(phone)) {
      return NextResponse.json({ success: false, message: '手机号格式不正确' }, { status: 400, headers: HEADERS })
    }

    if (!checkIpRateLimit(ip)) {
      return NextResponse.json({ message: '请求过于频繁，请稍后再试' }, { status: 429, headers: HEADERS })
    }
    if (!checkPhoneRateLimit(phone)) {
      return NextResponse.json({ message: '请求过于频繁，请稍后再试' }, { status: 429, headers: HEADERS })
    }

    const code = String(randomInt(100000, 999999))
    const codeHash = await bcrypt.hash(code, 10)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    // Delete old unexpired OTPs for this phone
    await prisma.otpRecord.deleteMany({
      where: { phone, expiresAt: { gt: new Date() } },
    })

    await prisma.otpRecord.create({ data: { phone, codeHash, expiresAt } })

    await sendOtp(phone, code)

    return NextResponse.json({ success: true }, { headers: HEADERS })
  } catch (e) {
    console.error('[send-otp]', e)
    return NextResponse.json({ success: false, message: '发送失败，请稍后重试' }, { status: 500, headers: HEADERS })
  }
}
