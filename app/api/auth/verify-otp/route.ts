import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

const HEADERS = { 'X-Content-Type-Options': 'nosniff' }

export async function POST(req: NextRequest) {
  const start = Date.now()

  try {
    const { phone, code } = await req.json()
    if (!phone || !code) {
      await delay(300, start)
      return NextResponse.json({ success: false, message: '参数缺失' }, { status: 400, headers: HEADERS })
    }

    const otp = await prisma.otpRecord.findFirst({
      where: { phone, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      await delay(300, start)
      return NextResponse.json({ success: false, message: '验证码无效或已过期' }, { status: 400, headers: HEADERS })
    }

    // Increment attempts
    await prisma.otpRecord.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } })

    if (otp.attempts + 1 > 3) {
      await prisma.otpRecord.delete({ where: { id: otp.id } })
      await delay(300, start)
      return NextResponse.json({ success: false, message: '验证码已失效，请重新获取' }, { status: 400, headers: HEADERS })
    }

    const match = await bcrypt.compare(code, otp.codeHash)
    if (!match) {
      await delay(300, start)
      return NextResponse.json({ success: false, message: '验证码错误' }, { status: 400, headers: HEADERS })
    }

    // Success — delete OTP
    await prisma.otpRecord.delete({ where: { id: otp.id } })

    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } })
    let isNewUser = false
    if (!user) {
      const last4 = phone.slice(-4)
      user = await prisma.user.create({
        data: { phone, username: `用户${last4}`, isNewUser: true },
      })
      isNewUser = true
    }

    // Create session
    const session = await getSession()
    session.player1 = {
      id: user.id,
      username: user.username,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage as 'EN' | 'ZH',
    }
    await session.save()

    await delay(300, start)
    return NextResponse.json({ success: true, isNewUser }, { headers: HEADERS })
  } catch (e) {
    console.error('[verify-otp]', e)
    await delay(300, start)
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500, headers: HEADERS })
  }
}

function delay(ms: number, start: number) {
  const elapsed = Date.now() - start
  const remaining = ms - elapsed
  if (remaining > 0) return new Promise((r) => setTimeout(r, remaining))
  return Promise.resolve()
}
