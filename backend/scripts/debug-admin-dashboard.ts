import axios from 'axios';

const API_URL = `{environment.apiUrl}`;

async function debugAdminDashboard() {
  console.log('\n🔍 DEBUGGING ADMIN DASHBOARD\n');

  try {
    // Step 1: Admin Login
    console.log('Step 1: Admin Login...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@blooddonation.com',
      password: 'Admin@123'
    });

    const adminToken = loginResponse.data.data.token;
    console.log('✅ Admin logged in');
    console.log(`   Token: ${adminToken.substring(0, 30)}...`);

    // Step 2: Check pending users
    console.log('\nStep 2: Fetching pending users...');
    try {
      const pendingResponse = await axios.get(`${API_URL}/users/pending`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Pending users endpoint works');
      console.log(`   Count: ${pendingResponse.data.data.length}`);
      console.log(`   Data:`, JSON.stringify(pendingResponse.data.data, null, 2));
    } catch (error: any) {
      console.log('❌ Pending users endpoint failed');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message}`);
    }

    // Step 3: Check all users
    console.log('\nStep 3: Fetching all users...');
    try {
      const allUsersResponse = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ All users endpoint works');
      console.log(`   Count: ${allUsersResponse.data.data.length}`);
      console.log(`   Data:`, JSON.stringify(allUsersResponse.data.data, null, 2));
    } catch (error: any) {
      console.log('❌ All users endpoint failed');
      console.log(`   Status: ${error.response?.status}`);
      console.log(`   Error: ${error.response?.data?.message}`);
    }

    // Step 4: Register a test user
    console.log('\nStep 4: Registering test user...');
    const testEmail = `debuguser${Date.now()}@test.com`;
    try {
      const registerResponse = await axios.post(`${API_URL}/auth/register`, {
        email: testEmail,
        password: 'TestPass123'
      });
      console.log('✅ User registered');
      console.log(`   Email: ${testEmail}`);
      console.log(`   ID: ${registerResponse.data.data.user.id}`);
      console.log(`   isApproved: ${registerResponse.data.data.user.isApproved}`);
    } catch (error: any) {
      console.log('❌ Registration failed');
      console.log(`   Error: ${error.response?.data?.message}`);
    }

    // Step 5: Check pending users again
    console.log('\nStep 5: Fetching pending users again...');
    try {
      const pendingResponse = await axios.get(`${API_URL}/users/pending`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      console.log('✅ Pending users after registration');
      console.log(`   Count: ${pendingResponse.data.data.length}`);
      if (pendingResponse.data.data.length > 0) {
        console.log(`   Users:`, JSON.stringify(pendingResponse.data.data, null, 2));
      } else {
        console.log('   ⚠️  No pending users found!');
      }
    } catch (error: any) {
      console.log('❌ Failed to fetch pending users');
      console.log(`   Error: ${error.response?.data?.message}`);
    }

  } catch (error: any) {
    console.log('❌ Debug failed');
    console.log(`   Error: ${error.message}`);
  }
}

debugAdminDashboard();
