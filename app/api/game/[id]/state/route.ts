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

    const board: number[][] = JSON.parse(game.boardState)
    const moveHistory: unknown[] = JSON.parse(game.moveHistory)
    const winningStones = JSON.parse(game.winningStones)
    const pendingMissionData = game.pendingMissionData ? JSON.parse(game.pendingMissionData) : null

    const currentTurnPlayerId =
      game.currentTurn === 1 ? game.player1Id : (game.player2Id ?? null)

    // Lookup next game if rematch was created
    let nextGame: { id: string; roomCode: string } | null = null
    if (game.nextGameId) {
      const ng = await prisma.gameSession.findUnique({
        where: { id: game.nextGameId },
        select: { id: true, roomCode: true },
      })
      nextGame = ng ?? null
    }

    return NextResponse.json({
      id: game.id,
      roomCode: game.roomCode,
      status: game.status,
      player1: game.player1,
      player2: game.player2 ?? null,
      currentTurn: game.currentTurn,
      currentTurnPlayerId,
      boardState: board,
      winningStones,
      moveCount: moveHistory.length,
      winnerId: game.winnerId,
      winner: game.winner ?? null,
      pendingMissionData,
      missionLogs: game.missionLogs,
      nextGame,
      player1Ready: game.player1Ready,
      player2Ready: game.player2Ready,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
