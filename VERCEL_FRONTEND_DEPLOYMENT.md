# Vercel Frontend Deployment Guide

## Overview
This guide walks you through deploying the Medical Reminder - Health Logger frontend to Vercel.

**Prerequisites:**
- ✅ Vercel account created (https://vercel.com)
- ✅ Backend deployed on Render (See `RENDER_BACKEND_DEPLOYMENT.md`)
- ✅ Backend URL ready (e.g., `https://health-logger-backend.onrender.com`)

---

## Step 1: Create a Vercel Account

### 1.1 Sign Up

1. Go to **https://vercel.com**
2. Click **"Sign Up"** button
3. **Recommended:** Sign up with **GitHub** (easiest integration)
4. Authorize Vercel to access your GitHub account
5. Complete the signup process

### 1.2 Verify Email

Check your email for verification link and click it

---

## Step 2: Prepare Frontend Code

### 2.1 Verify package.json

Check your `frontend/package.json` has correct build scripts:

```json
{
  "name": "healthtracker-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "lint": "eslint .",
    "format": "prettier --write \"src/**/*.{js,jsx}\""
  }
}
```

✅ Vercel will use `npm run build` command

### 2.2 Verify config.js

Check `frontend/src/config.js` reads environment variables:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL ||
  (isProduction
    ? 'https://your-backend-url.onrender.com/api'
    : 'http://localhost:5000/api');
```

✅ Configuration correctly uses `REACT_APP_API_BASE_URL` variable

### 2.3 Verify vercel.json

Check `frontend/vercel.json` exists:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "env": {
    "REACT_APP_API_BASE_URL": "@react_app_api_base_url"
  }
}
```

✅ Vercel configuration is properly set up

### 2.4 Create .env.local for Local Development

Create `frontend/.env.local`:

```bash
# frontend/.env.local (DO NOT commit)
REACT_APP_API_BASE_URL=http://localhost:5000/api
```

**This file is for local development only. DO NOT commit to Git.**

Verify it's in `.gitignore`:
```bash
# Should be in .gitignore
frontend/.env.local
frontend/.env.development.local
```

### 2.5 Push Code to GitHub

Make sure all frontend code is pushed:

```bash
cd frontend
git add .
git commit -m "Prepare frontend for Vercel deployment"
git push origin main
```

---

## Step 3: Import Project to Vercel

### 3.1 Access Vercel Dashboard

1. Go to **https://vercel.com/dashboard**
2. Click **"New Project"** button (or "Add New" → "Project")

### 3.2 Import Git Repository

1. Click **"Import Git Repository"**
2. Choose **"GitHub"** as your Git provider
3. If not authorized, click **"Connect GitHub"**
4. Authorize Vercel to access your repositories
5. Search for and select: **`Medical_Reminder_-_Health_Logger`**
6. Click **"Import"**

### 3.3 Verify Project Settings

Vercel should auto-detect settings. Verify:

| Setting | Value | Status |
|---------|-------|--------|
| **Project Name** | medical-reminder-health-logger | Should auto-fill |
| **Framework** | Create React App | Auto-detected |
| **Root Directory** | `./frontend` | Auto-detected |
| **Build Command** | `npm run build` | Auto-detected |
| **Output Directory** | `build` | Auto-detected |
| **Install Command** | `npm install` | Auto-detected |

✅ If any are wrong, click **"Edit"** to change them

---

## Step 4: Add Environment Variables

### 4.1 Configure Environment Variables

On the import page, you should see **"Environment Variables"** section

If not visible, click **"Advanced"** to expand it

### 4.2 Add Your Backend URL

Click **"Add"** or **"Add New"**:

| Field | Value |
|-------|-------|
| **Name** | `REACT_APP_API_BASE_URL` |
| **Value** | `https://health-logger-backend.onrender.com/api` |

Replace with your actual backend URL from Render

**Example values:**
```
# If your backend is:
https://my-health-logger-backend.onrender.com

# Then REACT_APP_API_BASE_URL should be:
https://my-health-logger-backend.onrender.com/api
```

### 4.3 Add Optional Variables (Optional)

You can also add:

```
REACT_APP_ENVIRONMENT=production
REACT_APP_ENABLE_ANALYTICS=true
```

---

## Step 5: Deploy the Frontend

### 5.1 Click Deploy

1. Review all settings are correct
2. Click the **"Deploy"** button
3. Vercel will start deploying your frontend

### 5.2 Monitor Deployment

You'll see:
```
Building your project...
> npm install
> npm run build
```

**Deployment takes 2-5 minutes**

Watch for these messages:
```
Creating an optimized production build...
✓ Compiled successfully
Installing dependencies...
✓ Vercel Functions initialized
✓ Running 'npm run build'
✓ Build completed
✓ Deployment complete
```

### 5.3 Get Your Frontend URL

Once deployment completes:
- You'll see **"Congratulations"** message
- Your frontend URL will be displayed:
  ```
  https://medical-reminder-health-logger.vercel.app
  ```

**Copy and save this URL** - you'll need it later!

---

## Step 6: Test Your Deployment

### 6.1 Visit Your Frontend

1. Click the deployment URL
2. Your HealthTracker login page should load
3. Verify styling and layout look correct

### 6.2 Check Browser Console

1. Press `F12` to open Developer Tools
2. Go to **"Console"** tab
3. Should show no errors (some warnings are okay)

### 6.3 Test API Connection

1. Try to **Register** a new account
2. Enter test credentials:
   ```
   Email: testuser@example.com
   Password: Test@1234
   Full Name: Test User
   ```
3. Click **"Sign Up"**

### 6.4 Verify Network Requests

1. Open **"Network"** tab in Developer Tools
2. Try to register again
3. Look for API request to:
   ```
   https://health-logger-backend.onrender.com/api/register
   ```
4. Should return **Status: 200 or 201** (success)

---

## Step 7: Fix CORS Issues (If Needed)

If you see CORS errors in the console:
```
Access to XMLHttpRequest at 'https://health-logger-backend.onrender.com/api/login' 
from origin 'https://medical-reminder-health-logger.vercel.app' 
has been blocked by CORS policy
```

### Solution: Update Backend CORS

1. Go to **Render Dashboard**
2. Click on your **`health-logger-backend`** service
3. Go to **"Settings"** → **"Environment"**
4. Update the `CORS_ORIGIN` variable:
   ```
   CORS_ORIGIN=https://medical-reminder-health-logger.vercel.app
   ```
5. Click **"Save Changes"**
6. Render will automatically redeploy (takes 1-2 minutes)
7. Retry login on your frontend

---

## Step 8: Enable Automatic Deployments

Vercel automatically deploys whenever you push to GitHub:

### 8.1 How It Works

```bash
# Make changes to frontend code
# Commit and push to GitHub
git add .
git commit -m "Your changes"
git push origin main

# Vercel detects the push
# Automatically builds and deploys
# Takes 1-2 minutes
```

### 8.2 View Deployment History

1. Go to your project in Vercel: **https://vercel.com/dashboard**
2. Click your project name
3. Go to **"Deployments"** tab
4. See all past deployments with timestamps

### 8.3 Rollback to Previous Deployment

If something breaks:

1. Go to **"Deployments"** tab
2. Find the last working deployment
3. Click **"..."** menu
4. Click **"Rollback"**
5. Frontend reverts to that version (1-2 minutes)

---

## Step 9: Test End-to-End Flow

### 9.1 Register New Account

1. Visit your frontend URL
2. Click **"Sign Up"**
3. Enter details:
   ```
   Full Name: Test User
   Email: test@yourmail.com
   Password: Test@1234
   ```
4. Click **"Sign Up"**

**Expected:** Account created, redirected to login

### 9.2 Login

1. Enter email and password
2. Click **"Login"**

**Expected:** Logged in successfully, see dashboard

### 9.3 Add Medication

1. Go to **"Medications"** page
2. Click **"Add Medication"**
3. Fill in details:
   ```
   Name: Aspirin
   Dosage: 500mg
   Frequency: Daily
   Time: 8:00 AM
   ```
4. Click **"Save"**

**Expected:** Medication added and displayed

### 9.4 Add Health Metric

1. Go to **"Health Metrics"** page
2. Click **"Add Metric"**
3. Fill in details:
   ```
   Type: Weight
   Value: 75
   Unit: kg
   Date: Today
   ```
4. Click **"Save"**

**Expected:** Metric added and chart updates

### 9.5 View Dashboard

1. Go to **"Dashboard"** page
2. Check:
   - Health Score displays
   - Medications show
   - Health Metrics Trend chart appears

**Expected:** All data displays correctly

---

## Step 10: Monitor Performance

### 10.1 View Analytics

1. Go to your project in Vercel
2. Click **"Analytics"** tab
3. View:
   - **Response Time** - Page load speed
   - **Requests** - Number of API calls
   - **Errors** - Any failures
   - **Usage** - Bandwidth used

### 10.2 Check Build Output

1. Go to **"Deployments"** tab
2. Click latest deployment
3. View **"Build Output"** for any warnings
4. Check **"Runtime Logs"** for errors

### 10.3 Monitor Core Web Vitals

Vercel shows performance metrics:
- **Largest Contentful Paint (LCP)** - < 2.5s
- **First Input Delay (FID)** - < 100ms
- **Cumulative Layout Shift (CLS)** - < 0.1

If any are high, optimize images, code splitting, etc.

---

## Common Issues & Solutions

### Issue 1: Build Failed

**Error Message:**
```
Build step failed: Command "npm run build" exited with 1
```

**Causes & Solutions:**
1. **Missing dependencies**
   - Check `package.json` has all imports
   - Verify no syntax errors
   - Run `npm install` locally first

2. **Import errors**
   - Check file paths are correct
   - Verify all components exist
   - Look for circular imports

3. **Configuration issues**
   - Check `vercel.json` is valid JSON
   - Verify `config.js` is correct

**Fix:**
```bash
cd frontend
npm install
npm run build  # Test build locally
git push origin main
```

### Issue 2: Blank Page After Deploy

**Problem:** Frontend loads but shows blank white page

**Causes:**
1. API is not responding
2. JavaScript error in console
3. Missing environment variable

**Solutions:**
1. Open DevTools (F12) → Console
2. Look for error messages
3. Check Network tab - see if API calls work
4. Verify `REACT_APP_API_BASE_URL` is set

### Issue 3: Cannot Connect to Backend

**Error:** Login/Register buttons don't work

**Causes:**
1. CORS not configured
2. Backend URL is wrong
3. Backend service is down

**Solutions:**

Check backend URL:
```javascript
// Should print your backend URL
console.log(process.env.REACT_APP_API_BASE_URL);
```

Verify CORS:
- Go to Render backend settings
- Update `CORS_ORIGIN` to your Vercel URL
- Wait for redeploy (1-2 minutes)
- Try again

Check backend status:
- Visit `https://your-backend-url.onrender.com/`
- Should load without error

### Issue 4: Old Code Still Showing

**Problem:** Changes don't appear after push

**Cause:** Vercel has cached version

**Solution:**
1. Go to project in Vercel
2. Click **"Settings"** → **"Git"**
3. Click **"Disconnect Project"**
4. Click **"Connect"** again
5. Redeploy from scratch

Or clear browser cache:
```
Ctrl + Shift + Delete (Windows)
Cmd + Shift + Delete (Mac)
```

### Issue 5: Environment Variable Not Working

**Problem:** `process.env.REACT_APP_API_BASE_URL` is undefined

**Cause:** Variable not set in Vercel

**Solution:**
1. Go to project → **"Settings"**
2. Go to **"Environment Variables"**
3. Add: `REACT_APP_API_BASE_URL` = your backend URL
4. Go to **"Deployments"** → **"Redeploy"**
5. Choose latest commit
6. Click **"Redeploy"**

---

## Performance Optimization

### 10.1 Image Optimization

```javascript
// Use next/image (if using Next.js)
// Or optimize images before deploying
```

### 10.2 Code Splitting

React automatically code-splits lazy-loaded routes

### 10.3 Caching

Vercel automatically caches static assets (CSS, JS, images)

---

## Security Best Practices

### 11.1 Environment Variables

- ✅ Never commit `.env.local` to Git
- ✅ Use Vercel's environment variable UI
- ✅ Don't expose sensitive keys in frontend code

### 11.2 HTTPS

- ✅ Vercel provides HTTPS by default
- ✅ All connections are encrypted

### 11.3 CORS

- ✅ Only allow requests from your backend
- ✅ Don't use `*` for CORS_ORIGIN in production

---

## Troubleshooting Checklist

Before contacting support, verify:

- [ ] Backend is deployed and running
- [ ] `REACT_APP_API_BASE_URL` set correctly
- [ ] Backend `CORS_ORIGIN` includes your Vercel URL
- [ ] No syntax errors in code
- [ ] All dependencies in package.json
- [ ] `.env.local` is in `.gitignore`
- [ ] Code is pushed to GitHub main branch
- [ ] Browser cache cleared
- [ ] No VPN/Proxy blocking API calls

---

## Next Steps

Once frontend is deployed:

1. ✅ **Share the URL** with users: `https://your-domain.vercel.app`
2. ✅ **Set up custom domain** (optional)
   - Go to project → Settings → Domains
   - Add your custom domain
3. ✅ **Configure analytics** (optional)
   - Set up Google Analytics
   - Monitor user behavior
4. ✅ **Plan upgrades** (optional)
   - Pro plan for analytics
   - Edge functions for API routes

---

## Custom Domain Setup (Optional)

### Add Your Own Domain

1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Enter your domain (e.g., `health-logger.com`)
4. Click **"Add"**
5. Follow DNS instructions for your domain registrar

Vercel will issue SSL certificate automatically

---

## API Reference for Frontend

### Environment Variables

```javascript
// Available in your React code
process.env.REACT_APP_API_BASE_URL  // Backend API URL
process.env.REACT_APP_ENV           // Environment (production/development)
```

### Useful Vercel Features

- **Preview Deployments:** Each PR gets its own deployment
- **Analytics:** Built-in performance monitoring
- **Edge Functions:** Run code close to users
- **Database Integration:** Connect to databases
- **Serverless Functions:** Create API routes

---

## Quick Reference

### Important URLs

```
Frontend URL: https://medical-reminder-health-logger.vercel.app
Backend URL: https://health-logger-backend.onrender.com
API Base: https://health-logger-backend.onrender.com/api
Dashboard: https://vercel.com/dashboard
```

### Environment Variables

```
REACT_APP_API_BASE_URL=https://health-logger-backend.onrender.com/api
```

### Deployment Checklist

- [ ] Code pushed to GitHub main
- [ ] Environment variables set in Vercel
- [ ] Build completes without errors
- [ ] Frontend loads without errors
- [ ] API calls work (check Network tab)
- [ ] All pages accessible
- [ ] Login/Register works
- [ ] Data displays correctly

---

## Support & Resources

- **Vercel Documentation:** https://vercel.com/docs
- **React Documentation:** https://react.dev
- **Deployment Guide:** https://vercel.com/guides/deploying-react
- **Performance:** https://vercel.com/analytics
- **Community:** https://github.com/vercel/vercel

---

## Completion Checklist

- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] Backend URL verified working
- [ ] CORS configured on backend
- [ ] All pages load correctly
- [ ] No console errors
- [ ] Login/Register working
- [ ] Data saves and retrieves correctly
- [ ] Responsive design works on mobile
- [ ] Performance is good (check Analytics)

---

**Status:** Frontend Successfully Deployed ✓

Your Medical Reminder - Health Logger is now live at: **https://medical-reminder-health-logger.vercel.app** 🚀
