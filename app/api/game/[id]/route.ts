import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const game = await prisma.gameSession.findUnique({
      where: { id: params.id },
      include: {
        player1: { select: { id: true, username: true, phone: true, preferredLanguage: true, gamesPlayed: true, wins: true } },
        player2: { select: { id: true, username: true, phone: true, preferredLanguage: true, gamesPlayed: true, wins: true } },
        winner: { select: { id: true, username: true } },
        missionLogs: {
          orderBy: { createdAt: 'asc' },
          include: { assignedToPlayer: { select: { id: true, username: true } } },
        },
      },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...game,
      boardState: JSON.parse(game.boardState),
      moveHistory: JSON.parse(game.moveHistory),
      winningStones: JSON.parse(game.winningStones),
      pendingMissionData: game.pendingMissionData ? JSON.parse(game.pendingMissionData) : null,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
