import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function clean() {
  try {
    console.log('🧹 Cleaning Database...');
    
    await prisma.donorCampaign.deleteMany();
    console.log('✅ Donor Campaigns deleted.');

    await prisma.donor.deleteMany();
    console.log('✅ All Donors deleted.');

    console.log('🎉 Database is ready for the new Import Test!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clean();