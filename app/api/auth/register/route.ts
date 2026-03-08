import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { phone, password, username, preferredLanguage } = await req.json()

    if (!phone || !password || !username) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json({ error: 'phoneExists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        phone,
        passwordHash,
        username,
        preferredLanguage: preferredLanguage || 'EN',
      },
    })

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
