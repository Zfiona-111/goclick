import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { checkWin, shouldTriggerMission, selectMission } from '@/lib/gameLogic'
import { getMission } from '@/lib/missions'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session.player1) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const currentUserId = session.player1.id

    const { row, col } = await req.json()

    const game = await prisma.gameSession.findUnique({
      where: { id: params.id },
      include: { player1: true, player2: true },
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    if (game.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Game is not active' }, { status: 400 })
    }
    if (game.pendingMissionData) {
      return NextResponse.json({ error: 'Mission pending acknowledgment' }, { status: 400 })
    }

    // Validate it is this user's turn
    const isPlayer1Turn = game.player1Id === currentUserId && game.currentTurn === 1
    const isPlayer2Turn = game.player2Id === currentUserId && game.currentTurn === 2
    if (!isPlayer1Turn && !isPlayer2Turn) {
      return NextResponse.json({ error: 'Not your turn' }, { status: 403 })
    }

    const board: number[][] = JSON.parse(game.boardState)
    const moveHistory: { row: number; col: number; player: number }[] = JSON.parse(game.moveHistory)

    if (row < 0 || row >= 15 || col < 0 || col >= 15 || board[row][col] !== 0) {
      return NextResponse.json({ error: 'Invalid move' }, { status: 400 })
    }

    const currentPlayer = game.currentTurn
    board[row][col] = currentPlayer
    moveHistory.push({ row, col, player: currentPlayer })

    const winResult = checkWin(board, row, col, currentPlayer)

    if (winResult) {
      // Win — update stats, finish game
      const winnerId = currentPlayer === 1 ? game.player1Id : game.player2Id!
      const loserIdArr = [game.player1Id, game.player2Id].filter(Boolean) as string[]
      await prisma.user.updateMany({
        where: { id: { in: loserIdArr } },
        data: { gamesPlayed: { increment: 1 } },
      })
      await prisma.user.update({
        where: { id: winnerId },
        data: { wins: { increment: 1 } },
      })
      await prisma.gameSession.update({
        where: { id: params.id },
        data: {
          boardState: JSON.stringify(board),
          moveHistory: JSON.stringify(moveHistory),
          status: 'FINISHED',
          winnerId,
          winningStones: JSON.stringify(winResult.stones),
        },
      })
      return NextResponse.json({
        status: 'FINISHED',
        winnerId,
        winningStones: winResult.stones,
        moveCount: moveHistory.length,
      })
    }

    // Check mission
    if (shouldTriggerMission()) {
      const missionId = selectMission()
      const mission = getMission(missionId)
      if (mission) {
        const assignedPlayerId = currentPlayer === 1 ? game.player1Id : game.player2Id!
        const assignedPlayerRecord = currentPlayer === 1 ? game.player1 : game.player2!
        const lang = (assignedPlayerRecord.preferredLanguage as 'EN' | 'ZH') || 'EN'
        const missionText = lang === 'ZH' ? mission.zh.text : mission.en.text

        const missionLog = await prisma.missionLog.create({
          data: {
            gameSessionId: game.id,
            missionId,
            missionText,
            assignedToPlayerId: assignedPlayerId,
            triggeredAtMove: moveHistory.length,
          },
        })

        const pendingMissionData = {
          logId: missionLog.id,
          missionId,
          missionTitleEN: mission.en.title,
          missionTitleZH: mission.zh.title,
          missionTextEN: mission.en.text,
          missionTextZH: mission.zh.text,
          assignedToPlayerId: assignedPlayerId,
          assignedToPlayerName: assignedPlayerRecord.username,
          triggeredAtMove: moveHistory.length,
        }

        // Do NOT switch turn — mission blocks it
        await prisma.gameSession.update({
          where: { id: params.id },
          data: {
            boardState: JSON.stringify(board),
            moveHistory: JSON.stringify(moveHistory),
            pendingMissionData: JSON.stringify(pendingMissionData),
          },
        })

        return NextResponse.json({
          status: 'ACTIVE',
          currentTurn: game.currentTurn,
          pendingMissionData,
          moveCount: moveHistory.length,
        })
      }
    }

    // Normal move — switch turn
    const nextTurn = currentPlayer === 1 ? 2 : 1
    await prisma.gameSession.update({
      where: { id: params.id },
      data: {
        boardState: JSON.stringify(board),
        moveHistory: JSON.stringify(moveHistory),
        currentTurn: nextTurn,
      },
    })

    return NextResponse.json({
      status: 'ACTIVE',
      currentTurn: nextTurn,
      pendingMissionData: null,
      moveCount: moveHistory.length,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
