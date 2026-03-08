import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getSession()
    if (!session.player1) {
      return NextResponse.json({ user: null, player1: null })
    }
    const user = await prisma.user.findUnique({ where: { id: session.player1.id } })
    if (!user) {
      return NextResponse.json({ user: null, player1: null })
    }
    const userData = {
      id: user.id,
      username: user.username,
      phone: user.phone,
      preferredLanguage: user.preferredLanguage,
      gamesPlayed: user.gamesPlayed,
      wins: user.wins,
    }
    return NextResponse.json({ user: userData, player1: userData })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
