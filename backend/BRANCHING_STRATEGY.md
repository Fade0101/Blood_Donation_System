# 🌿 Git Branching Strategy

## Overview

Your project uses a **Git Flow** branching model:

```
main (Production)
  ↑
  └── Pull Request / Merge
       ↑
    dev (Development)
      ↑
      └── Pull Request / Merge
           ↑
        feature/* (Feature Branches)
```

---

## 📋 Branch Structure

### `main` - Production Ready ⭐
- **Status**: Stable, production-ready code only
- **When to merge to**: After thorough testing in `dev`
- **Protection**: Should be protected (require PR review)
- **Deploy from**: YES - This branch is deployed to production
- **Current**: Points to `d28110f`

### `dev` - Development 🚀
- **Status**: Latest development code
- **When to merge to**: When features are complete and tested
- **What merges here**: Feature branches and bug fixes
- **Deploy from**: NO - This is for testing only
- **Current**: Points to `d28110f`

### `feature/*` - Feature Development 🛠️
- **Status**: Temporary branches for specific features
- **Naming**: `feature/feature-name` (e.g., `feature/user-authentication`)
- **Branched from**: `dev`
- **Merges back to**: `dev` (via Pull Request)
- **Delete after**: Merge to `dev` is complete

---

## 🔄 Workflow

### 1️⃣ Creating a New Feature

```bash
# Switch to dev and pull latest
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... edit files ...

# Commit changes
git add .
git commit -m "feat: description of what you did"

# Push to GitHub
git push origin feature/your-feature-name
```

### 2️⃣ Create Pull Request (PR) to Dev

1. Go to GitHub: https://github.com/Fade0101/Blood_Donation_System
2. Click "Pull requests" → "New pull request"
3. **Base branch**: `dev`
4. **Compare branch**: `feature/your-feature-name`
5. Add description and request review
6. Merge when approved

### 3️⃣ Merge to Dev

```bash
# After PR is merged, delete feature branch
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name

# Switch to dev
git checkout dev
git pull origin dev
```

### 4️⃣ Release to Production (Main)

When you're ready to go live:

```bash
# Switch to main
git checkout main
git pull origin main

# Merge dev into main
git merge --no-ff dev -m "Release v1.0.0"

# Push to production
git push origin main

# Tag the release (optional)
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

---

## 📊 Current Branches

```
✅ main
   └─ d28110f (Initial commit)

✅ dev
   └─ d28110f (Initial commit)
```

---

## 👥 Team Collaboration

### Frontend Team
1. Clone repo: `git clone https://github.com/Fade0101/Blood_Donation_System.git`
2. Checkout dev: `git checkout dev`
3. Create feature branch: `git checkout -b feature/frontend-feature`
4. Make changes and commit
5. Push and create PR to `dev`

### Backend Team (You)
1. Same workflow as frontend
2. Create feature branches from `dev`
3. Merge PRs into `dev`
4. When ready for production, merge `dev` → `main`

---

## 🛡️ Branch Protection Rules

Recommend setting these up on GitHub:

**For `main` branch:**
- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass (CI/CD)
- ✅ Dismiss stale pull request approvals
- ✅ Require branches to be up to date before merging

**For `dev` branch:**
- ✅ Require pull request reviews before merging
- ✅ Allow force pushes (optional, for cleanup)

---

## 💡 Best Practices

1. **Always work on feature branches**
   - Never commit directly to `main` or `dev`

2. **Use clear naming conventions**
   - `feature/user-authentication`
   - `bugfix/fix-donor-validation`
   - `hotfix/fix-critical-error`

3. **Write meaningful commit messages**
   ```
   feat: add donor validation endpoint
   fix: resolve duplicate registration error
   refactor: simplify error handling middleware
   ```

4. **Keep commits small and focused**
   - One feature per branch
   - One concern per commit

5. **Pull before you push**
   ```bash
   git pull origin dev
   git push origin feature/your-feature
   ```

6. **Use Pull Requests for code review**
   - Discuss changes with team
   - Request reviews before merging

---

## 📝 Commit Message Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `style`: Code style changes
- `docs`: Documentation changes
- `test`: Test additions/modifications
- `chore`: Build, dependency updates

**Example:**
```
feat(donors): add blood type validation

- Validate blood type enum in DTO
- Update donor creation endpoint
- Add test cases for invalid types

Closes #123
```

---

## 🚨 Emergency Hotfixes

If critical bug found in production:

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Fix the bug
git commit -m "hotfix: fix critical issue"

# Merge back to main
git checkout main
git merge --no-ff hotfix/critical-bug-fix
git push origin main

# Also merge to dev to keep in sync
git checkout dev
git merge --no-ff hotfix/critical-bug-fix
git push origin dev

# Clean up
git branch -d hotfix/critical-bug-fix
```

---

## 📍 Current Status

✅ **Setup Complete!**

```
Repository: https://github.com/Fade0101/Blood_Donation_System
├── main  → https://github.com/Fade0101/Blood_Donation_System/tree/main (Production)
└── dev   → https://github.com/Fade0101/Blood_Donation_System/tree/dev (Development)
```

You're ready to start development! 🚀
