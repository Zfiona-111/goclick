import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { username: 'TestPlayer1' },
    update: {},
    create: {
      username: 'TestPlayer1',
      preferredLanguage: 'EN',
    },
  })

  await prisma.user.upsert({
    where: { username: 'TestPlayer2' },
    update: {},
    create: {
      username: 'TestPlayer2',
      preferredLanguage: 'ZH',
    },
  })

  console.log('Seed complete.')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
