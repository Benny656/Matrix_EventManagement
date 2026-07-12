import { hashPassword } from "better-auth/crypto";
import { prisma } from "./src/lib/db";

async function main() {
  const users = [
    {
      email: "matrixkarunya@gmail.com",
      name: "Matrix Karunya",
      password: "matrixkits"
    },
    {
      email: "bennymanuel2020@gmail.com",
      name: "Benny Manuel",
      password: "nissangtr"
    }
  ];

  for (const u of users) {
    const hashed = await hashPassword(u.password);
    
    let user = await prisma.user.findUnique({ where: { email: u.email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: "ADMIN",
          emailVerified: true
        }
      });
      console.log(`Created user ${u.email}`);
    } else {
      user = await prisma.user.update({
        where: { email: u.email },
        data: { role: "ADMIN" }
      });
      console.log(`Updated user ${u.email} to ADMIN`);
    }

    const account = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" }
    });

    if (!account) {
      await prisma.account.create({
        data: {
          accountId: user.id,
          providerId: "credential",
          userId: user.id,
          password: hashed,
        }
      });
      console.log(`Created account for ${u.email}`);
    } else {
      await prisma.account.update({
        where: { id: account.id },
        data: { password: hashed }
      });
      console.log(`Updated account password for ${u.email}`);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
