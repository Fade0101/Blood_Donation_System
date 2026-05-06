import bcrypt from "bcryptjs";
import prisma from "../config/prisma";

const ADMIN_EMAIL = "admin@blooddonation.com";
const ADMIN_PASSWORD = "Admin@123";

export const seedAdminAccount = async (): Promise<void> => {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: ADMIN_EMAIL }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await prisma.user.create({
      data: {
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: "ADMIN",
        isApproved: true
      }
    });

    console.log("Admin account created successfully.");
  } else {
    console.log("Admin account already exists.");
  }

  console.log("Admin credentials:");
  console.log(`Email: ${ADMIN_EMAIL}`);
  console.log(`Password: ${ADMIN_PASSWORD}`);
};
