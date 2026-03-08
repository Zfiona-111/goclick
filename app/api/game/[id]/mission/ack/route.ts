import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session.player1) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const currentUserId = session.player1.id

    const game = await prisma.gameSession.findUnique({ where: { id: params.id } })
    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }
    if (!game.pendingMissionData) {
      return NextResponse.json({ error: 'No pending mission' }, { status: 400 })
    }

    const pending = JSON.parse(game.pendingMissionData)
    if (pending.assignedToPlayerId !== currentUserId) {
      return NextResponse.json({ error: 'Not your mission to acknowledge' }, { status: 403 })
    }

    // Clear mission and switch turn
    const nextTurn = game.currentTurn === 1 ? 2 : 1
    await prisma.gameSession.update({
      where: { id: game.id },
      data: {
        pendingMissionData: null,
        currentTurn: nextTurn,
      },
    })

    return NextResponse.json({ ok: true, nextTurn })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
