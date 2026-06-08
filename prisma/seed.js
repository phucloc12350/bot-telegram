const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@local.dev';
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const name = process.env.ADMIN_NAME || 'Administrator';

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, isActive: true },
    create: {
      email,
      name,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('Seeded admin:', { id: user.id, email: user.email, name: user.name });

  const defaultBot = await prisma.botSetting.findFirst({ where: { botName: 'Daily Gold Report' } });
  if (!defaultBot && process.env.TELEGRAM_DEFAULT_CHAT_ID) {
    await prisma.botSetting.create({
      data: {
        botName: 'Daily Gold Report',
        botType: 'GOLD',
        chatId: process.env.TELEGRAM_DEFAULT_CHAT_ID,
        isActive: true,
        cronExpression: '0 9 * * *',
        messageTemplate: null,
      },
    });
    console.log('Created default Gold bot setting.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
