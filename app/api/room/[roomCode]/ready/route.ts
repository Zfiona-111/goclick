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

    const game = await prisma.gameSession.findUnique({ where: { roomCode: params.roomCode } })
    if (!game) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }
    if (game.status !== 'WAITING_READY') {
      return NextResponse.json({ error: 'Room not in ready phase' }, { status: 400 })
    }

    const isPlayer1 = game.player1Id === userId
    const isPlayer2 = game.player2Id === userId
    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json({ error: 'Not a player in this room' }, { status: 403 })
    }

    const updateData: Record<string, boolean> = {}
    if (isPlayer1) updateData.player1Ready = true
    if (isPlayer2) updateData.player2Ready = true

    const updated = await prisma.gameSession.update({
      where: { id: game.id },
      data: updateData,
    })

    // Both ready: randomly assign who goes first then activate
    if (updated.player1Ready && updated.player2Ready) {
      const player1GoesFirst = Math.random() < 0.5

      let finalPlayer1Id = updated.player1Id
      let finalPlayer2Id = updated.player2Id!

      if (!player1GoesFirst) {
        // Swap so the "goes-first" player becomes player1 (pink stones)
        finalPlayer1Id = updated.player2Id!
        finalPlayer2Id = updated.player1Id
      }

      await prisma.gameSession.update({
        where: { id: game.id },
        data: {
          status: 'ACTIVE',
          currentTurn: 1,
          player1Id: finalPlayer1Id,
          player2Id: finalPlayer2Id,
        },
      })
    }

    return NextResponse.json({ ok: true, status: updated.player1Ready && updated.player2Ready ? 'ACTIVE' : 'WAITING_READY' })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
