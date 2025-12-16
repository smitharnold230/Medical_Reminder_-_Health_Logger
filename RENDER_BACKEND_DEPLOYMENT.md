# Render Backend Deployment Guide

## Overview
This guide walks you through deploying the Medical Reminder - Health Logger backend to Render.

**Prerequisites:**
- ✅ Render account created (https://render.com)
- ✅ PostgreSQL database set up on Render (See `RENDER_DATABASE_SETUP.md`)
- ✅ Database URL saved (e.g., `postgresql://...`)

---

## Step 1: Verify Backend Configuration

Your backend is already pre-configured. Verify these files exist and are correct:

### 1.1 Check package.json

```json
{
  "name": "healthtracker-backend",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node server.js",
    "setup-db": "node setup-database.js"
  }
}
```

✅ Render will use `npm start` command automatically

### 1.2 Check server.js

Verify the server reads environment variables:
```javascript
require('dotenv').config({ path: './environment.env' });
const PORT = process.env.PORT || 5000;
```

✅ The server correctly reads PORT from environment

### 1.3 Check db.js

Should use DATABASE_URL:
```javascript
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ...
});
```

✅ Database connection is environment-based

---

## Step 2: Prepare Code for Deployment

### 2.1 Create Backend .env.example

Verify `.env.example` exists in the backend folder:

```bash
# backend/.env.example
DATABASE_URL=postgresql://user:password@host:5432/healthtracker
PORT=5000
NODE_ENV=production
JWT_SECRET=your_secret_key_here
CORS_ORIGIN=https://your-frontend-url.vercel.app
LOG_LEVEL=info
```

### 2.2 Verify .gitignore

Make sure sensitive files are ignored:
```bash
# Should NOT be committed
environment.env
.env
.env.local
node_modules/
```

### 2.3 Push Code to GitHub

Make sure all your backend code is pushed:
```bash
cd backend
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

---

## Step 3: Create Web Service on Render

### 3.1 Access Render Dashboard

1. Go to **https://dashboard.render.com**
2. Click the **"New+"** button (top right)
3. Select **"Web Service"** from the menu

### 3.2 Connect Your Repository

1. Choose **"Deploy from GitHub"**
2. If not authorized, click **"Connect your GitHub account"**
3. Authorize Render to access your repositories
4. Select your repository: **`Medical_Reminder_-_Health_Logger`**
5. Click **"Connect"**

### 3.3 Configure Service Settings

Fill in the following details:

| Field | Value | Notes |
|-------|-------|-------|
| **Name** | `health-logger-backend` | URL-friendly name |
| **Environment** | `Node` | Runtime environment |
| **Region** | Same as database (e.g., `Ohio`) | Better performance |
| **Branch** | `main` | Deploy from main branch |
| **Root Directory** | `backend` | Location of package.json |
| **Build Command** | Leave empty | Auto-detected from package.json |
| **Start Command** | Leave empty | Auto-detected: `npm start` |
| **Plan** | `Free` or `Starter` | Start with Free tier |

---

## Step 4: Add Environment Variables

### 4.1 Click "Advanced" Section

Look for **"Advanced"** or **"Environment"** section in the deployment form

### 4.2 Add Each Environment Variable

Click **"Add Environment Variable"** for each:

#### Variable 1: DATABASE_URL
```
Key: DATABASE_URL
Value: postgresql://healthtracker_user:YOUR_PASSWORD@your-db-host.postgres.render.com:5432/healthtracker
```

#### Variable 2: JWT_SECRET
Generate a strong secret. Use one of these methods:

**Method 1: Online Generator**
- Go to https://www.uuidgenerator.net/
- Generate a UUID
- Use that as your JWT_SECRET

**Method 2: OpenSSL (Terminal)**
```bash
openssl rand -hex 32
# Output example: a7f3b8c9d2e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8
```

**Method 3: Node.js (Terminal)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```
Key: JWT_SECRET
Value: a7f3b8c9d2e1f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8
```

#### Variable 3: NODE_ENV
```
Key: NODE_ENV
Value: production
```

#### Variable 4: CORS_ORIGIN
**Important:** Add your Vercel frontend URL here

```
Key: CORS_ORIGIN
Value: https://your-frontend-url.vercel.app
```

Get the frontend URL from Vercel or use your domain

#### Variable 5: LOG_LEVEL
```
Key: LOG_LEVEL
Value: info
```

#### Variable 6: PORT (Optional)
```
Key: PORT
Value: 5000
```

*Note: Render assigns the port automatically, but you can specify it*

### 4.3 Summary of Variables

Your environment variables should look like:
```
DATABASE_URL = postgresql://healthtracker_user:***@dpg-xxx.postgres.render.com:5432/healthtracker
JWT_SECRET = a7f3b8c9d2e1f4a5b6c7d8e9f0a1b2c3d4e5f6a
NODE_ENV = production
CORS_ORIGIN = https://medical-reminder-health-logger.vercel.app
LOG_LEVEL = info
```

---

## Step 5: Create the Web Service

1. Review all settings are correct
2. Click the **"Create Web Service"** button
3. Render will start deploying your backend

---

## Step 6: Monitor Deployment

### 6.1 Watch the Build Logs

1. You'll see a live build log in the Render dashboard
2. Look for these messages (in order):
   ```
   Building backend...
   npm install
   npm start
   Server running on port 5000
   Connected to database successfully
   ```

### 6.2 Deployment Should Take 2-5 Minutes

Common log messages:
```
Cloning repository...
Installing dependencies...
Building application...
Starting server...
Server running on port 10000 on 0.0.0.0
API server initialized successfully
```

### 6.3 Check Deployment Status

Once complete:
- Status should show **"Live"** in green
- You'll see a service URL: `https://health-logger-backend.onrender.com`
- Copy this URL - you'll need it for the frontend

---

## Step 7: Test Your Backend

### 7.1 Basic Health Check

Test if your backend is running:
```bash
curl https://health-logger-backend.onrender.com/

# Or in browser:
# https://health-logger-backend.onrender.com/
```

Expected response: Server is running message or JSON response

### 7.2 Test API Endpoints

**Test Register Endpoint:**
```bash
curl -X POST https://health-logger-backend.onrender.com/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

Expected response:
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com"
  }
}
```

**Test Login Endpoint:**
```bash
curl -X POST https://health-logger-backend.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

Expected response:
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 7.3 Test with Postman (Optional)

1. Download **Postman** from https://www.postman.com
2. Import your API endpoints
3. Test each endpoint with your backend URL

---

## Step 8: View Logs

### 8.1 Access Logs in Render Dashboard

1. Click on your **`health-logger-backend`** service
2. Click the **"Logs"** tab
3. View real-time logs

### 8.2 Common Log Messages

```
INFO: Server running on port 10000
INFO: Database connected successfully
INFO: CORS enabled for https://medical-reminder-health-logger.vercel.app
```

### 8.3 Troubleshoot Errors

If you see errors:
```
ERROR: Cannot connect to database
ERROR: JWT_SECRET not set
ERROR: CORS origin not configured
```

**Solution:** Check environment variables are set correctly in Render dashboard

---

## Step 9: Set Up Auto-Redeployment

Render automatically redeploys when you push to GitHub:

**Push changes to trigger deployment:**
```bash
git add .
git commit -m "Backend changes"
git push origin main
```

Render will detect the push and automatically redeploy within 1-2 minutes

---

## Step 10: Update Backend for Database

### 10.1 Initialize Database Schema (if not done)

If your database doesn't have tables yet:

**Option 1: Run setup script locally**
```bash
cd backend
DATABASE_URL=postgresql://... npm run setup-db
```

**Option 2: Use Render shell**
1. In Render dashboard, click "Shell" tab
2. Run:
   ```bash
   cd backend
   npm run setup-db
   ```

---

## Common Issues & Solutions

### Issue 1: Build Failed

**Error Message:**
```
Build failed: npm ERR! 404 Not Found
```

**Solutions:**
- Check `package.json` dependencies exist
- Run `npm install` locally to verify
- Check internet connection during build
- Delete `package-lock.json` and retry

### Issue 2: Cannot Connect to Database

**Error Message:**
```
error: ECONNREFUSED - Cannot connect to database
```

**Solutions:**
- Verify `DATABASE_URL` is correct in Render environment variables
- Check database is running in Render (should show "Available")
- Check database credentials are correct
- Try connecting locally with the same URL

### Issue 3: CORS Errors

**Error Message:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**
- Verify `CORS_ORIGIN` matches your frontend URL exactly
- Include the full URL: `https://your-domain.vercel.app`
- Not just `your-domain.vercel.app`
- Redeploy after updating CORS_ORIGIN

### Issue 4: JWT_SECRET Not Set

**Error Message:**
```
Error: JWT_SECRET is required
```

**Solutions:**
- Go to Render dashboard
- Add `JWT_SECRET` environment variable
- Make sure you're not leaving it empty
- Redeploy the service

### Issue 5: Service Keeps Crashing

**Error Message:**
```
Application crashed
```

**Solutions:**
1. Check logs in Render dashboard
2. Verify all environment variables are set
3. Check database connection
4. Try deploying again

---

## Performance Optimization

### Enable Auto-Scaling (Paid Plan)
1. Upgrade to "Standard" plan
2. Enable auto-scaling for high traffic
3. Automatic scaling based on CPU/memory

### Monitor Performance
1. Go to "Metrics" tab in Render
2. View:
   - CPU usage
   - Memory usage
   - Request latency
   - Error rates

---

## Next Steps

Once your backend is deployed:

1. ✅ **Copy the backend URL** (e.g., `https://health-logger-backend.onrender.com`)
2. ✅ **Update frontend configuration** - See `VERCEL_FRONTEND_DEPLOYMENT.md`
3. ✅ **Deploy frontend** - Follow Vercel deployment guide
4. ✅ **Update CORS_ORIGIN** - Include your frontend URL
5. ✅ **Test end-to-end** - Login from frontend to backend

---

## Quick Reference

### Useful Commands

```bash
# View logs
curl https://health-logger-backend.onrender.com/health

# Test connection
curl https://health-logger-backend.onrender.com/

# Check if API is working
curl -X GET https://health-logger-backend.onrender.com/api/health
```

### Environment Variables Checklist

- [ ] DATABASE_URL set correctly
- [ ] JWT_SECRET is strong (32+ characters)
- [ ] NODE_ENV = production
- [ ] CORS_ORIGIN set to frontend URL
- [ ] LOG_LEVEL = info

### Status Checks

- [ ] Service shows "Live" (green status)
- [ ] No errors in logs
- [ ] Database connection successful
- [ ] API endpoints respond
- [ ] CORS working (no CORS errors)

---

## Support & Resources

- **Render Documentation:** https://render.com/docs/web-services
- **Node.js Best Practices:** https://nodejs.org/en/docs/
- **Express.js Guide:** https://expressjs.com/
- **PostgreSQL Guide:** https://www.postgresql.org/docs/

---

**Status:** Backend Ready for Frontend Integration ✓
