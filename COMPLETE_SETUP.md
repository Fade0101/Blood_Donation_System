# 🩸 Blood Donation System - Complete Setup & Usage Guide

## ✅ System Status

Both backend and frontend are fully operational with the complete Authentication & User Approval System implemented.

---

## 🚀 Starting the System

### Terminal 1: Start Backend
```bash
cd "E:\Blood Donation System\backend"
npm run dev
```
✅ Backend running on: `http://localhost:5000`

### Terminal 2: Start Frontend
```bash
cd "E:\Blood Donation System\frontend\blood-donation-frontend"
npm start
```
✅ Frontend running on: `http://localhost:4200`

---

## 👤 Initial Admin Account

| Field | Value |
|-------|-------|
| **Email** | `admin@blooddonation.com` |
| **Password** | `Admin@123` |
| **Role** | ADMIN |
| **Status** | Pre-approved ✅ |

⚠️ **IMPORTANT:** Change this password immediately after first login!

---

## 📋 Complete User Approval Workflow

### Step 1️⃣: Admin Login
1. Open `http://localhost:4200/login`
2. Enter admin credentials:
   - Email: `admin@blooddonation.com`
   - Password: `Admin@123`
3. Click "Sign in"
4. You're now logged in as admin

### Step 2️⃣: New User Registration
1. Open `http://localhost:4200/register` (or click "تسجيل" in navbar)
2. Fill in:
   - Email: `user@example.com`
   - Password: `Password123`
   - Confirm Password: `Password123`
3. Click "Register"
4. See success message: **"Registration successful! Waiting for admin approval."**
5. User account created with `isApproved: false`

### Step 3️⃣: Admin Reviews Pending Users
1. As admin, click "لوحة التحكم" (Admin Dashboard) in navbar
2. Or navigate to `http://localhost:4200/admin`
3. You see **"Pending Approvals"** tab with the new user
4. Shows: Email, Registration Date

### Step 4️⃣: Admin Approves User
1. In "Pending Approvals" tab, click **"Approve"** button
2. User moves to **"Approved Users"** tab
3. Toast notification: "User approved successfully"
4. User's `isApproved` status changed to `true`

### Step 5️⃣: User Can Now Login
1. Open `http://localhost:4200/login`
2. Enter the approved user's credentials
3. Click "Sign in"
4. ✅ Successfully logged in!
5. Can now access: Home, Donors, Campaigns, Dashboard

---

## 🎮 Admin Dashboard Features

### Pending Approvals Tab
- Shows all users waiting for approval
- Displays: Email, Registration Date
- Actions:
  - ✅ **Approve** - User gets access to system
  - ❌ **Reject** - User account deleted

### Approved Users Tab
- Shows all approved users
- Displays: Email, Role (ADMIN/STAFF), Approval Date
- Actions:
  - 🛡️ **Make Admin** - Promote STAFF to ADMIN
  - 👤 **Make Staff** - Demote ADMIN to STAFF

---

## 🔐 Security Features Implemented

✅ **Password Hashing**
- bcryptjs with 10 salt rounds
- Passwords never stored in plain text

✅ **JWT Authentication**
- 7-day token expiry
- Secure token storage in localStorage
- Automatic token injection in all API requests

✅ **Role-Based Access Control (RBAC)**
- ADMIN: Full system access + user management
- STAFF: System access (no user management)

✅ **Approval Workflow**
- New users cannot login until approved
- Prevents unauthorized access
- Admin-only approval endpoints

✅ **Protected Routes**
- `/admin` - Admin only (adminGuard)
- `/home`, `/donors`, `/campaigns` - Authenticated users only (authGuard)
- `/login`, `/register` - Public

✅ **Server-Side Rendering Safe**
- localStorage checks for browser environment
- No SSR errors

---

## 🧪 Test Scenarios

### Scenario 1: Complete Approval Flow
```
1. Register: user1@test.com / Password123
2. Try login → "Your account is pending admin approval"
3. Admin approves user
4. Login succeeds ✅
```

### Scenario 2: Reject User
```
1. Register: user2@test.com / Password123
2. Admin rejects user
3. User deleted from database
4. Cannot login anymore ✅
```

### Scenario 3: Promote User to Admin
```
1. Approve user as STAFF
2. Admin clicks "Make Admin"
3. User role changes to ADMIN
4. User can now access admin dashboard ✅
```

### Scenario 4: Invalid Credentials
```
1. Try login with wrong password
2. See error: "Invalid credentials" ✅
```

---

## 📱 Navigation Map

```
Public Routes:
├── /login          → Login page
└── /register       → Registration page

Protected Routes (Authenticated Users):
├── /home           → Home page
├── /donors         → Donor management
├── /campaigns      → Campaign management
└── /dashboard      → User dashboard

Admin Routes (ADMIN Role Only):
└── /admin          → Admin dashboard
    ├── Pending Approvals tab
    └── Approved Users tab
```

---

## 🔌 API Endpoints

### Authentication (Public)
```
POST /api/auth/register
POST /api/auth/login
```

### User Management (Admin Only)
```
GET    /api/users/pending           → Get pending users
GET    /api/users                   → Get all approved users
PATCH  /api/users/:id/approve       → Approve user
PATCH  /api/users/:id/reject        → Reject user
PATCH  /api/users/:id/role          → Change user role
```

---

## 📊 Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   (hashed with bcryptjs)
  role      Role     @default(STAFF)
  isApproved Boolean @default(false)  ← NEW: Approval status
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  STAFF
}
```

---

## 🛠️ Troubleshooting

### Issue: "Your account is pending admin approval"
**Cause:** User not approved yet  
**Solution:** Ask admin to approve your account in Admin Dashboard

### Issue: "Invalid credentials"
**Cause:** Wrong email or password  
**Solution:** Check email/password and try again

### Issue: Cannot access Admin Dashboard
**Cause:** Not logged in as ADMIN  
**Solution:** Only ADMIN role users can access `/admin`

### Issue: Backend errors on login
**Expected:** These are normal error messages:
- "Your account is pending admin approval" ✅
- "Invalid credentials" ✅

### Issue: Frontend won't load
**Solution:** 
1. Check if backend is running on port 5000
2. Check if frontend is running on port 4200
3. Clear browser cache and reload

---

## 📁 Project Structure

```
Blood Donation System/
├── backend/
│   ├── src/
│   │   ├── services/auth.service.ts
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── middlewares/auth.middleware.ts
│   │   └── routes/auth.routes.ts
│   ├── prisma/schema.prisma
│   └── scripts/seed-admin.ts
│
├── frontend/
│   └── blood-donation-frontend/
│       └── src/app/
│           ├── services/auth.service.ts
│           ├── core/
│           │   ├── guards/
│           │   │   ├── auth.guard.ts
│           │   │   └── admin.guard.ts
│           │   └── interceptors/auth.interceptor.ts
│           └── components/
│               ├── login/
│               ├── register/
│               └── admin-dashboard/
│
├── QUICK_START.md
├── USER_APPROVAL_SYSTEM.md
└── COMPLETE_SETUP.md (this file)
```

---

## 🎯 Key Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| User Registration | ✅ | New users register with email/password |
| Admin Approval | ✅ | Admins approve/reject users |
| Secure Login | ✅ | JWT + bcrypt password hashing |
| Role Management | ✅ | ADMIN/STAFF roles with different permissions |
| Protected Routes | ✅ | Auth guard + Admin guard |
| Admin Dashboard | ✅ | Manage users and approvals |
| Responsive UI | ✅ | Works on desktop and mobile |
| Arabic Support | ✅ | UI ready for Arabic translation |

---

## 🚀 Next Steps (Optional Enhancements)

- [ ] Email notifications on approval/rejection
- [ ] Admin can send rejection reason
- [ ] User can resend registration request
- [ ] Audit log of all approvals
- [ ] Bulk approval/rejection
- [ ] User profile management
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Email verification
- [ ] User activity logging

---

## 📞 Support

For detailed information, see:
- `QUICK_START.md` - Quick reference
- `USER_APPROVAL_SYSTEM.md` - Detailed documentation
- Backend logs - Check terminal for API errors
- Browser console - Check for frontend errors

---

## ✨ System Ready!

Your Blood Donation System is now fully operational with:
- ✅ Complete authentication system
- ✅ User approval workflow
- ✅ Role-based access control
- ✅ Admin dashboard
- ✅ Secure password handling
- ✅ JWT token management

**Happy coding! 🎉**
