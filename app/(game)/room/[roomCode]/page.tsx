import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function RoomPage({ params }: { params: { roomCode: string } }) {
  const game = await prisma.gameSession.findUnique({
    where: { roomCode: params.roomCode.toUpperCase() },
    select: { id: true },
  })

  if (!game) {
    redirect('/lobby')
  }

  redirect(`/game/${game.id}`)
}
