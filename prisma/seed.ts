import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash1 = await bcrypt.hash('test1', 10)
  const hash2 = await bcrypt.hash('test2', 10)

  await prisma.user.upsert({
    where: { phone: '10000000001' },
    update: {},
    create: {
      phone: '10000000001',
      passwordHash: hash1,
      username: 'TestPlayer1',
      preferredLanguage: 'EN',
    },
  })

  await prisma.user.upsert({
    where: { phone: '10000000002' },
    update: {},
    create: {
      phone: '10000000002',
      passwordHash: hash2,
      username: 'TestPlayer2',
      preferredLanguage: 'ZH',
    },
  })

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
