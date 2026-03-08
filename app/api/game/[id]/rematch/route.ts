import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { initBoard } from '@/lib/gameLogic'

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session.player1) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const oldGame = await prisma.gameSession.findUnique({ where: { id: params.id } })
    if (!oldGame || oldGame.status !== 'FINISHED') {
      return NextResponse.json({ error: 'Game not finished' }, { status: 400 })
    }
    if (oldGame.nextGameId) {
      // Already created a rematch — return it
      const ng = await prisma.gameSession.findUnique({ where: { id: oldGame.nextGameId } })
      return NextResponse.json({ gameId: ng!.id, roomCode: ng!.roomCode })
    }

    // Loser goes first (becomes player1 for pink stones)
    const loserId =
      oldGame.winnerId === oldGame.player1Id
        ? (oldGame.player2Id ?? oldGame.player1Id)
        : oldGame.player1Id
    const winnerId2 = loserId === oldGame.player1Id ? (oldGame.player2Id ?? oldGame.player1Id) : oldGame.player1Id

    const board = initBoard()
    let roomCode = generateRoomCode()
    let attempts = 0
    while (attempts < 10) {
      const ex = await prisma.gameSession.findUnique({ where: { roomCode } })
      if (!ex) break
      roomCode = generateRoomCode()
      attempts++
    }

    const newGame = await prisma.gameSession.create({
      data: {
        roomCode,
        player1Id: loserId,
        player2Id: winnerId2,
        player1Ready: false,
        player2Ready: false,
        currentTurn: 1,
        status: 'WAITING_READY',
        boardState: JSON.stringify(board),
        moveHistory: JSON.stringify([]),
        triggeredMissions: JSON.stringify([]),
        winningStones: JSON.stringify([]),
      },
    })

    await prisma.gameSession.update({
      where: { id: params.id },
      data: { nextGameId: newGame.id },
    })

    return NextResponse.json({ gameId: newGame.id, roomCode })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
