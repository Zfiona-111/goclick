import { NextResponse } from 'next/server'
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

export async function POST() {
  try {
    const session = await getSession()
    if (!session.player1) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const board = initBoard()
    let roomCode = generateRoomCode()

    // Ensure unique code (retry on collision)
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.gameSession.findUnique({ where: { roomCode } })
      if (!existing) break
      roomCode = generateRoomCode()
      attempts++
    }

    const game = await prisma.gameSession.create({
      data: {
        roomCode,
        player1Id: session.player1.id,
        currentTurn: 1,
        status: 'WAITING_FOR_PLAYER',
        boardState: JSON.stringify(board),
        moveHistory: JSON.stringify([]),
        triggeredMissions: JSON.stringify([]),
        winningStones: JSON.stringify([]),
      },
    })

    return NextResponse.json({ roomCode, gameId: game.id })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
