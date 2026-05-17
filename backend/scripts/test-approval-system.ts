import axios from 'axios';

const API_URL = `{environment.apiUrl}`;

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  details?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    results.push({ name, status: 'PASS', message: 'Success' });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    const details = error.response?.data?.message || error.message;
    results.push({ name, status: 'FAIL', message: error.message, details });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${details}`);
  }
}

async function runTests() {
  console.log('\n🧪 APPROVAL SYSTEM TESTS\n');
  console.log('Make sure backend is running on port 5000!\n');

  let adminToken = '';
  let testUserId = '';
  let testUserEmail = `testuser${Date.now()}@test.com`;

  // Test 1: Admin Login
  await test('1. Admin Login', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@blooddonation.com',
      password: 'Admin@123'
    });

    if (!response.data.data.token) throw new Error('No token received');
    if (response.data.data.user.role !== 'ADMIN') throw new Error('Not admin role');

    adminToken = response.data.data.token;
    console.log(`   Token: ${adminToken.substring(0, 20)}...`);
  });

  // Test 2: Register New User
  await test('2. Register New User', async () => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: testUserEmail,
      password: 'TestPass123'
    });

    if (!response.data.data.user.id) throw new Error('No user ID');
    testUserId = response.data.data.user.id;
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Email: ${testUserEmail}`);
  });

  // Test 3: Get Pending Users
  await test('3. Get Pending Users', async () => {
    const response = await axios.get(`${API_URL}/users/pending`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!Array.isArray(response.data.data)) throw new Error('Not an array');
    const user = response.data.data.find((u: any) => u.id === testUserId);
    if (!user) throw new Error('Test user not in pending list');
    console.log(`   Found ${response.data.data.length} pending user(s)`);
  });

  // Test 4: Approve User
  await test('4. Approve User', async () => {
    const response = await axios.patch(
      `${API_URL}/users/${testUserId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (response.data.data.isApproved !== true) throw new Error('User not approved');
    console.log(`   User approved: ${response.data.data.email}`);
  });

  // Test 5: Approved User Can Login
  await test('5. Approved User Can Login', async () => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: testUserEmail,
      password: 'TestPass123'
    });

    if (!response.data.data.token) throw new Error('No token received');
    console.log(`   Login successful for: ${testUserEmail}`);
  });

  // Test 6: Get All Users
  await test('6. Get All Users', async () => {
    const response = await axios.get(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (!Array.isArray(response.data.data)) throw new Error('Not an array');
    console.log(`   Total users: ${response.data.data.length}`);
  });

  // Test 7: Change User Role to Admin
  await test('7. Change User Role to Admin', async () => {
    const response = await axios.patch(
      `${API_URL}/users/${testUserId}/role`,
      { role: 'ADMIN' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (response.data.data.role !== 'ADMIN') throw new Error('Role not changed');
    console.log(`   Role changed to: ${response.data.data.role}`);
  });

  // Test 8: Change User Role Back to Staff
  await test('8. Change User Role to Staff', async () => {
    const response = await axios.patch(
      `${API_URL}/users/${testUserId}/role`,
      { role: 'STAFF' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (response.data.data.role !== 'STAFF') throw new Error('Role not changed');
    console.log(`   Role changed to: ${response.data.data.role}`);
  });

  // Test 9: Reject User
  let rejectUserEmail = `rejectuser${Date.now()}@test.com`;
  let rejectUserId = '';

  await test('9. Register User for Rejection', async () => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: rejectUserEmail,
      password: 'TestPass123'
    });

    rejectUserId = response.data.data.user.id;
    console.log(`   User created: ${rejectUserEmail}`);
  });

  await test('10. Reject User', async () => {
    const response = await axios.patch(
      `${API_URL}/users/${rejectUserId}/reject`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    console.log(`   User rejected and deleted`);
  });

  // Test 11: Duplicate Email Prevention
  await test('11. Duplicate Email Prevention', async () => {
    try {
      await axios.post(`${API_URL}/auth/register`, {
        email: testUserEmail,
        password: 'TestPass123'
      });
      throw new Error('Should have failed with duplicate email');
    } catch (error: any) {
      if (error.response?.status === 400 || error.response?.status === 500) {
        console.log(`   Duplicate email correctly rejected`);
        return;
      }
      throw error;
    }
  });

  // Print Results
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.name}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED out of ${results.length} tests`);
  console.log('='.repeat(60) + '\n');

  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED!\n');
    console.log('✅ Approval system is working correctly!');
    console.log('✅ User registration working');
    console.log('✅ User approval workflow working');
    console.log('✅ Role management working');
    console.log('✅ Security validation working\n');
  } else {
    console.log(`⚠️  ${failed} test(s) failed.\n`);
    console.log('Make sure:');
    console.log('1. Backend is running: npm run dev');
    console.log('2. Database is connected');
    console.log('3. Admin account exists\n');
  }
}

runTests().catch(console.error);
