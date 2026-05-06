# 🧪 Approval System Testing Guide

## ⚠️ IMPORTANT: Restart Backend First!

The backend needs to be restarted to pick up the route order fix.

### Step 1: Stop Backend
- Press `Ctrl+C` in the backend terminal

### Step 2: Start Backend Again
```bash
cd "E:\Blood Donation System\backend"
npm run dev
```

Wait for: `Server running on port 5000`

---

## 🚀 Run Automated Tests

Once backend is running, run the test suite:

```bash
cd "E:\Blood Donation System\backend"
npx ts-node scripts/test-approval-system.ts
```

---

## 📋 What Gets Tested

The automated test suite will verify:

✅ **Admin Login**
- Admin can login with correct credentials
- Receives JWT token
- Has ADMIN role

✅ **User Registration**
- New user can register
- User created with STAFF role
- User has isApproved = false

✅ **Pending Users List**
- Admin can view pending users
- New user appears in pending list

✅ **User Approval**
- Admin can approve pending user
- User's isApproved changes to true
- User moves to approved list

✅ **Approved User Login**
- Approved user can login successfully
- Receives JWT token

✅ **Get All Users**
- Admin can view all approved users
- Shows correct user count

✅ **Role Management**
- Admin can change user role to ADMIN
- Admin can change user role back to STAFF

✅ **User Rejection**
- Admin can reject pending user
- User is deleted from database

✅ **Duplicate Email Prevention**
- Cannot register with same email twice
- System prevents duplicate accounts

---

## 📊 Expected Test Results

After restart, you should see:

```
🧪 APPROVAL SYSTEM TESTS

✅ 1. Admin Login
✅ 2. Register New User
✅ 3. Get Pending Users
✅ 4. Approve User
✅ 5. Approved User Can Login
✅ 6. Get All Users
✅ 7. Change User Role to Admin
✅ 8. Change User Role to Staff
✅ 9. Register User for Rejection
✅ 10. Reject User
✅ 11. Duplicate Email Prevention

==================================================
TOTAL: 11 PASSED, 0 FAILED out of 11 tests
==================================================

🎉 ALL TESTS PASSED!
```

---

## 🔧 What Was Fixed

**Route Order Issue:**
- `/users/pending` must come BEFORE `/users/:id/*` routes
- Express matches routes in order
- Specific routes must come before parameterized routes

**Before (Wrong):**
```
GET /users/:id/role
GET /users/pending  ← Never reached!
```

**After (Correct):**
```
GET /users/pending  ← Matches first
GET /users/:id/role ← Matches second
```

---

## 🎯 Manual Testing (Optional)

If you want to test manually in the browser:

### 1. Admin Login
- URL: `http://localhost:4200/login`
- Email: `admin@blooddonation.com`
- Password: `Admin@123`

### 2. Register New User
- URL: `http://localhost:4200/register`
- Email: `testuser@example.com`
- Password: `TestPass123`

### 3. Try to Login (Should Fail)
- URL: `http://localhost:4200/login`
- Email: `testuser@example.com`
- Password: `TestPass123`
- Expected: "Your account is pending admin approval"

### 4. Admin Approves User
- Go to `/admin`
- Click "Approve" on pending user

### 5. Login Again (Should Work)
- URL: `http://localhost:4200/login`
- Email: `testuser@example.com`
- Password: `TestPass123`
- Expected: Redirects to home page

---

## ✅ System Status

After restart and successful tests:

✅ Backend: Running correctly  
✅ Routes: Fixed and working  
✅ Approval System: Fully functional  
✅ User Registration: Working  
✅ Admin Dashboard: Ready to use  
✅ Security: All validations passing  

---

## 📞 Troubleshooting

**Tests still failing after restart?**
1. Check backend console for errors
2. Verify database is connected
3. Verify admin account exists
4. Check that all routes are registered

**Backend won't start?**
1. Check if port 5000 is already in use
2. Check database connection
3. Check for TypeScript errors: `npm run build`

**Routes still not working?**
1. Verify route order in `src/routes/auth.routes.ts`
2. Rebuild: `npm run build`
3. Restart backend: `npm run dev`

---

## 🎉 Next Steps

Once all tests pass:
1. ✅ Approval system is production-ready
2. ✅ All security features working
3. ✅ Ready for user testing
4. ✅ Ready for deployment

**Your Blood Donation System is complete!** 🩸
