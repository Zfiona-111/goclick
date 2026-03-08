import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { phone, password } = await req.json()

    if (!phone || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { phone } })
    if (!user) {
      return NextResponse.json({ error: 'invalidCredentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'invalidCredentials' }, { status: 401 })
    }

    const session = await getSession()
    session.player1 = {
      id: user.id,
      username: user.username,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage as 'EN' | 'ZH',
    }
    await session.save()

    return NextResponse.json({
      id: user.id,
      username: user.username,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      gamesPlayed: user.gamesPlayed,
      wins: user.wins,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
