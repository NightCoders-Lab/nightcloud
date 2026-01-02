import { GLOBAL_ROOT_ID } from "@/config/constants";
import { DB } from "@/config/db";

import { GLOBAL_ROOT } from "./data/root";

// Obtener el cliente de Prisma
const prisma = DB.getClient();

async function main() {
  try {
    // Seed the global root node
    await prisma.node.upsert({
      where: { id: GLOBAL_ROOT_ID },
      create: GLOBAL_ROOT[0],
      update: {},
    });

    // Seed the root folders
    // await prisma.node.createMany({
    //   data: ROOT_FOLDERS,
    //   skipDuplicates: true,
    // });

    console.log("Seeding completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error(err);
  }
}

try {
  await main();
} catch (err) {
  console.error(err);
  process.exitCode = 1;
}
