# Quick Start: Deploy MedHel on Render

## 🚀 Essential Steps

### 1. ✅ Database Already Created
Your PostgreSQL database is already set up on Render:
- **Database URL**: `postgresql://admin:X6zmXh7aSTu9YJu3SUIY9IzaRpjJU6n1@dpg-d1kg6bmr433s73chmv8g-a.singapore-postgres.render.com/express_auth`
- **Location**: Singapore
- **Database Name**: express_auth

### 2. Create Backend Service on Render
- Create new **Web Service**
- Connect your GitHub repo
- Set **Root Directory**: `backend`
- Set **Build Command**: `npm install`
- Set **Start Command**: `npm start`

### 3. Set Environment Variables
Add these in your backend service settings:

```
DATABASE_URL=postgresql://admin:X6zmXh7aSTu9YJu3SUIY9IzaRpjJU6n1@dpg-d1kg6bmr433s73chmv8g-a.singapore-postgres.render.com/express_auth
JWT_SECRET=your_super_secret_key_here
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
PORT=10000
```

### 4. Update Frontend Configuration
In `frontend/src/config.js`, replace:
```javascript
'https://your-backend-service-name.onrender.com/api'
```
with your actual Render backend URL.

### 5. Setup Database Schema
After deployment, run:
```bash
npm run setup-db
```

## 📝 What I've Updated

✅ **Backend (`db.js`)**: Now supports both local development and Render's `DATABASE_URL` format
✅ **Environment Config**: Added comments and Render-specific variables
✅ **Frontend Config**: Auto-detects production vs development environment
✅ **Database Setup Script**: Easy way to initialize schema on Render
✅ **Package.json**: Added `setup-db` script

## 🔧 Your DATABASE_URL Format

The `DATABASE_URL` format you mentioned:
```
DATABASE_URL=postgresql://admin:X6zmXh7aSTu9YJu3SUIY9IzaRpjJU6n1@dpg-d1kg6bmr433s73chmv8g-a.singapore-postgres.render.com/express_auth
```

This is exactly what Render provides! Your database is already set up and ready to use.

## 🎯 Next Steps

1. **Deploy Backend**: Follow the steps above
2. **Deploy Frontend**: Use Vercel, Netlify, or Render
3. **Test**: Make sure everything works
4. **Monitor**: Check Render logs for any issues

## 📚 Full Guide

See `RENDER_DEPLOYMENT.md` for detailed instructions and troubleshooting. 