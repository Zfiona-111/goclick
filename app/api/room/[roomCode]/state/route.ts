import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { roomCode: string } }
) {
  try {
    const game = await prisma.gameSession.findUnique({
      where: { roomCode: params.roomCode },
      include: {
        player1: { select: { id: true, username: true, phone: true, preferredLanguage: true, gamesPlayed: true, wins: true } },
        player2: { select: { id: true, username: true, phone: true, preferredLanguage: true, gamesPlayed: true, wins: true } },
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json({
      roomCode: game.roomCode,
      gameId: game.id,
      status: game.status,
      player1: game.player1,
      player2: game.player2,
      player1Ready: game.player1Ready,
      player2Ready: game.player2Ready,
      boardPreview: true,
      player1StoneColor: '#FFAEB9',
      player2StoneColor: '#A2CD5A',
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
