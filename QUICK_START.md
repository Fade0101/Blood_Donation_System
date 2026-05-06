# Quick Start Guide - User Approval System

## 🚀 Getting Started

### 1. Start the Backend
```bash
cd backend
npm run dev
```
Backend runs on: `http://localhost:5000`

### 2. Start the Frontend
```bash
cd frontend/blood-donation-frontend
npm start
```
Frontend runs on: `http://localhost:4200`

## 👤 Initial Admin Login

**URL:** `http://localhost:4200/login`

| Field | Value |
|-------|-------|
| Email | `admin@blooddonation.com` |
| Password | `Admin@123` |

⚠️ **Change this password after first login!**

## 📋 User Approval Workflow

### For New Users:
1. Go to `/register`
2. Create account with email and password
3. See message: "Registration successful. Please wait for admin approval to access the system."
4. Cannot login until approved

### For Admins:
1. Login with admin credentials
2. Go to `/admin` (Admin Dashboard)
3. View "Pending Approvals" tab
4. Click "Approve" to allow user access
5. User can now login

## 🔑 Key Features

✅ **User Registration** - New users register but can't access system  
✅ **Admin Approval** - Admins review and approve/reject users  
✅ **Role Management** - Change user roles between ADMIN and STAFF  
✅ **Secure Authentication** - JWT tokens + bcrypt password hashing  
✅ **Protected Routes** - Only approved users can access the system  

## 📱 Navigation

| Route | Access | Purpose |
|-------|--------|---------|
| `/login` | Public | User login |
| `/register` | Public | New user registration |
| `/home` | Approved Users | Home page |
| `/admin` | ADMIN Only | User approval & management |
| `/donors` | Approved Users | Donor management |
| `/campaigns` | Approved Users | Campaign management |

## 🧪 Test Scenarios

### Scenario 1: Register and Get Approved
1. Register new user at `/register`
2. Try to login - should fail with "pending admin approval"
3. Login as admin
4. Go to `/admin` → "Pending Approvals"
5. Click "Approve"
6. Logout and login as new user - should succeed

### Scenario 2: Reject User
1. Register new user
2. Login as admin
3. Go to `/admin` → "Pending Approvals"
4. Click "Reject" - user is deleted
5. User cannot login anymore

### Scenario 3: Change User Role
1. Approve a user
2. Go to `/admin` → "Approved Users"
3. Click "Make Admin" to promote user
4. User now has admin access

## 🔐 Security

- Passwords hashed with bcryptjs (10 rounds)
- JWT tokens expire after 7 days
- Admin-only endpoints protected with middleware
- Role-based access control (RBAC)
- Approval workflow prevents unauthorized access

## 📞 Support

For issues or questions, check `USER_APPROVAL_SYSTEM.md` for detailed documentation.
