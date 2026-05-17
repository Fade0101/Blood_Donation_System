import app from "./app";
import prisma from "./config/prisma";
import { seedAdminAccount } from "./utils/seedAdmin";

const PORT = process.env.PORT || 5000;

async function main() {
  await prisma.$connect();
  console.log("Database connected successfully");
  await seedAdminAccount();

  const server = app.listen(PORT, () => {
    console.log(`[🚀 Server] Running on port: ${PORT}`);
    console.log(`[🌍 Environment] ${process.env.NODE_ENV || 'development'}`);
    console.log(`[🔗 CORS Frontend URL] ${process.env.FRONTEND_URL || 'http://localhost:4200'}`);
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
