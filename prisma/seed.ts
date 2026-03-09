import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "Admin1234!";
  const name = process.env.ADMIN_NAME ?? "Cantante";

  const hash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { username },
    update: {
      role: "admin",
      name,
      passwordHash: hash,
      active: true,
    },
    create: {
      role: "admin",
      username,
      name,
      passwordHash: hash,
      active: true,
    },
    select: { id: true, username: true, role: true, active: true, name: true },
  });

  console.log("✅ Admin listo:", user);
  console.log("🔑 Credenciales:", { username, password });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });