import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { lang, playerId } = await req.json()
    if (!lang || !playerId) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: playerId },
      data: { preferredLanguage: lang },
    })

    const session = await getSession()
    if (session.player1 && session.player1.id === playerId) {
      session.player1 = { ...session.player1, preferredLanguage: lang }
    }
    await session.save()

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
