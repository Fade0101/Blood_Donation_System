import app from "./app";
import prisma from "./config/prisma";
import { seedAdminAccount } from "./utils/seedAdmin";

const PORT = process.env.PORT || 5000;

async function main() {
  await prisma.$connect();
  console.log("Database connected successfully");
  await seedAdminAccount();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  const shutdown = async () => {
    console.log("Shutting down...");
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
