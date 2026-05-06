# User Approval System - Implementation Guide

## Overview
The Blood Donation System now includes a complete user approval workflow where:
- New users register but cannot access the system until approved by an admin
- Admins review pending registrations and approve/reject users
- Only approved users can login to the system
- Admins can manage user roles (ADMIN/STAFF)

## Initial Admin Account

**Email:** `admin@blooddonation.com`  
**Password:** `Admin@123`

⚠️ **IMPORTANT:** Change this password immediately after first login for security.

## User Registration Flow

### 1. User Registration
- User navigates to `/register`
- Fills in email and password
- System creates user with `isApproved: false`
- User sees success message: "Registration successful. Please wait for admin approval to access the system."
- User cannot login until approved

### 2. Admin Approval
- Admin logs in with admin credentials
- Navigates to `/admin` (Admin Dashboard)
- Views "Pending Approvals" tab
- Sees list of users waiting for approval
- Can **Approve** or **Reject** each user

### 3. After Approval
- Approved user receives notification (can be extended with email)
- User can now login with their credentials
- User gets access to the system

## Admin Dashboard Features

### Pending Approvals Tab
- Shows all users waiting for approval
- Displays: Email, Registration Date
- Actions: Approve, Reject

### Approved Users Tab
- Shows all approved users
- Displays: Email, Role (ADMIN/STAFF), Approval Date
- Actions: Make Admin, Make Staff

## Backend API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (isApproved: false)
- `POST /api/auth/login` - Login (checks isApproved status)

### User Management (Admin Only)
- `GET /api/users/pending` - Get pending users
- `GET /api/users` - Get all approved users
- `PATCH /api/users/:id/approve` - Approve user
- `PATCH /api/users/:id/reject` - Reject and delete user
- `PATCH /api/users/:id/role` - Change user role

## Database Schema

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      Role     @default(STAFF)
  isApproved Boolean @default(false)  // NEW FIELD
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum Role {
  ADMIN
  STAFF
}
```

## Frontend Components

### Login Component (`/login`)
- Email and password fields
- Shows error if user not approved: "Your account is pending admin approval"
- Redirects to register page

### Register Component (`/register`)
- Email, password, confirm password fields
- Shows success message with approval notice
- Redirects to login after registration

### Admin Dashboard (`/admin`)
- Protected by `adminGuard` - only ADMIN role can access
- Two tabs: Pending Approvals, Approved Users
- Real-time user management

## Security Features

✅ Passwords hashed with bcryptjs (10 salt rounds)  
✅ JWT tokens with 7-day expiry  
✅ Role-based access control (RBAC)  
✅ Admin-only endpoints protected with middleware  
✅ Approval workflow prevents unauthorized access  
✅ SSR-safe localStorage handling  

## Testing the System

### Step 1: Login as Admin
1. Go to `http://localhost:4200/login`
2. Enter: `admin@blooddonation.com` / `Admin@123`
3. Click "Sign in"

### Step 2: Register New User
1. Go to `http://localhost:4200/register`
2. Enter email and password
3. See success message about pending approval
4. Try to login - should see "Your account is pending admin approval"

### Step 3: Approve User
1. As admin, go to `/admin`
2. View "Pending Approvals" tab
3. Click "Approve" button
4. User moves to "Approved Users" tab

### Step 4: Login as Approved User
1. Go to `/login`
2. Enter the newly approved user's credentials
3. Successfully login and access the system

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   └── auth.service.ts          (Login checks isApproved)
│   ├── controllers/
│   │   ├── auth.controller.ts       (Register/Login)
│   │   └── user.controller.ts       (Approval endpoints)
│   ├── middlewares/
│   │   └── auth.middleware.ts       (verifyToken, requireRole)
│   └── routes/
│       └── auth.routes.ts           (All auth routes)
├── prisma/
│   └── schema.prisma                (User model with isApproved)
└── scripts/
    └── seed-admin.ts                (Create initial admin)

frontend/
├── src/app/
│   ├── services/
│   │   └── auth.service.ts          (Auth state with Signals)
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth.guard.ts        (Protect routes)
│   │   │   └── admin.guard.ts       (Admin-only routes)
│   │   └── interceptors/
│   │       └── auth.interceptor.ts  (Attach JWT token)
│   └── components/
│       ├── login/
│       ├── register/
│       └── admin-dashboard/
```

## Next Steps (Optional Enhancements)

- [ ] Email notifications on approval/rejection
- [ ] Admin can send rejection reason
- [ ] User can resend registration request
- [ ] Audit log of approvals
- [ ] Bulk approval/rejection
- [ ] User profile management
- [ ] Password reset functionality
- [ ] Two-factor authentication

## Troubleshooting

**Issue:** "Your account is pending admin approval"
- **Solution:** Ask an admin to approve your account in the Admin Dashboard

**Issue:** Admin cannot see pending users
- **Solution:** Ensure you're logged in as ADMIN role, not STAFF

**Issue:** Cannot access Admin Dashboard
- **Solution:** Only ADMIN role users can access `/admin` route

**Issue:** Approval button not working
- **Solution:** Check browser console for errors, ensure backend is running
