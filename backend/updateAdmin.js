import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('password', 10);
  await prisma.user.update({
    where: { email: 'admin@busbooking.com' },
    data: { password: hashed }
  });
  console.log('Admin password updated to "password"');
}

main().catch(console.error).finally(() => prisma.$disconnect());