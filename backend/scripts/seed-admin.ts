import prisma from "../src/config/prisma";
import { seedAdminAccount } from "../src/utils/seedAdmin";

async function runSeedAdmin() {
  try {
    await prisma.$connect();
    await seedAdminAccount();
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await prisma.$disconnect();
  }
}

runSeedAdmin();
