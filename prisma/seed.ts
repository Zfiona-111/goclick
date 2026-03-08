import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { phone: '10000000001' },
    update: {},
    create: {
      phone: '10000000001',
      username: 'TestPlayer1',
      preferredLanguage: 'EN',
    },
  })

  await prisma.user.upsert({
    where: { phone: '10000000002' },
    update: {},
    create: {
      phone: '10000000002',
      username: 'TestPlayer2',
      preferredLanguage: 'ZH',
    },
  })

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
