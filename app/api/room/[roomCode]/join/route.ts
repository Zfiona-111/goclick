import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    const session = await getSession()
    if (!session.player1) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const userId = session.player1.id

    const game = await prisma.gameSession.findUnique({
      where: { roomCode: params.roomCode },
      include: {
        player1: { select: { id: true, username: true } },
        player2: { select: { id: true, username: true } },
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    if (game.status === 'FINISHED') {
      return NextResponse.json({ error: 'Game already finished' }, { status: 400 })
    }

    // Already in room
    if (game.player1Id === userId || game.player2Id === userId) {
      return NextResponse.json({ roomCode: params.roomCode, gameId: game.id, status: game.status })
    }

    // Room is full
    if (game.player2Id) {
      return NextResponse.json({ error: 'Room is full' }, { status: 409 })
    }

    // Join as player2
    const updated = await prisma.gameSession.update({
      where: { id: game.id },
      data: {
        player2Id: userId,
        status: 'WAITING_READY',
      },
    })

    return NextResponse.json({ roomCode: params.roomCode, gameId: game.id, status: updated.status })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
