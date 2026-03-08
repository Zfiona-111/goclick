import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function POST(req: Request) {
  const body = await req.json()
  const nickname = (body.nickname ?? '').trim()

  if (!nickname) {
    return NextResponse.json({ message: '昵称不能为空' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { username: nickname } })
  if (existing) {
    return NextResponse.json(
      { message: 'Soooory，已有你的分身了，换一个昵称吧~' },
      { status: 409 }
    )
  }

  const user = await prisma.user.create({
    data: {
      username: nickname,
      phone: null,
      preferredLanguage: 'ZH',
    },
  })

  const session = await getSession()
  session.player1 = {
    id: user.id,
    username: user.username,
    preferredLanguage: user.preferredLanguage as 'EN' | 'ZH',
  }
  await session.save()

  return NextResponse.json({ success: true })
}
