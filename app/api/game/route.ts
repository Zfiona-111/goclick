import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { initBoard } from '@/lib/gameLogic'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.player1 || !session.player2) {
      return NextResponse.json({ error: 'Both players must be logged in' }, { status: 401 })
    }

    const { player1GoesFirst } = await req.json()

    // player1GoesFirst: boolean — determines who is player1 in the new game
    const p1Id = player1GoesFirst ? session.player1.id : session.player2.id
    const p2Id = player1GoesFirst ? session.player2.id : session.player1.id

    const board = initBoard()
    const game = await prisma.gameSession.create({
      data: {
        player1Id: p1Id,
        player2Id: p2Id,
        currentTurn: 1,
        status: 'ACTIVE',
        boardState: JSON.stringify(board),
        moveHistory: JSON.stringify([]),
        triggeredMissions: JSON.stringify([]),
        winningStones: JSON.stringify([]),
      },
    })

    session.currentGameId = game.id
    await session.save()

    return NextResponse.json({ gameId: game.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
