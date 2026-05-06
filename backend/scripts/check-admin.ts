import prisma from '../src/config/prisma';

async function checkAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@blooddonation.com' }
    });

    if (!admin) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   isApproved:', admin.isApproved);

    if (!admin.isApproved) {
      console.log('\n⚠️  Admin is not approved! Fixing...');
      const updated = await prisma.user.update({
        where: { email: 'admin@blooddonation.com' },
        data: { isApproved: true }
      });
      console.log('✅ Admin approved successfully');
      console.log('   isApproved:', updated.isApproved);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();
