# Vercel Frontend Deployment Guide

## 🚀 **Step 1: Update Frontend Configuration**

### Update API Base URL
In `frontend/src/config.js`, replace the placeholder with your actual Render backend URL:

```javascript
const API_BASE_URL = isProduction 
  ? 'https://medhel-backend.onrender.com/api'  // Your actual backend URL
  : 'http://localhost:5000/api';
```

**✅ Updated with your actual backend URL!**

## 🚀 **Step 2: Deploy to Vercel**

### Method 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from Frontend Directory**
   ```bash
   cd frontend
   vercel
   ```

4. **Follow the prompts:**
   - Set up and deploy: `Y`
   - Which scope: Select your account
   - Link to existing project: `N`
   - Project name: `medhel-frontend` (or your preferred name)
   - Directory: `./` (current directory)
   - Override settings: `N`

### Method 2: Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "New Project"**
3. **Import your GitHub repository**
4. **Configure project:**
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

## 🚀 **Step 3: Set Environment Variables**

In your Vercel project settings, add these environment variables:

```
REACT_APP_API_BASE_URL=https://medhel-backend.onrender.com/api
REACT_APP_ENVIRONMENT=production
```

## 🚀 **Step 4: Update Backend CORS**

In your Render backend, update the CORS_ORIGIN environment variable:

```
CORS_ORIGIN=https://your-frontend-name.vercel.app
```

## 🔧 **Configuration Files**

### Vercel Configuration (`frontend/vercel.json`)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "framework": "create-react-app",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Environment Variables
- **Development**: Uses localhost backend
- **Production**: Uses Render backend URL

## 🧪 **Testing the Connection**

### 1. Test Backend Connection
Visit your backend health check:
```
https://your-backend-name.onrender.com/api/health
```

### 2. Test Frontend
Visit your Vercel frontend:
```
https://your-frontend-name.vercel.app
```

### 3. Test Complete Flow
- Register a new user
- Login with credentials
- Check if data is saved/retrieved from Render database

## 🔍 **Troubleshooting**

### Common Issues:

1. **CORS Errors**
   - Update CORS_ORIGIN in Render backend
   - Make sure frontend URL is exactly correct

2. **API Connection Fails**
   - Check if backend URL is correct in frontend config
   - Verify backend is running on Render

3. **Build Fails**
   - Check if all dependencies are in package.json
   - Verify Node.js version compatibility

4. **Environment Variables Not Working**
   - Make sure to use `REACT_APP_` prefix for Vercel
   - Redeploy after changing environment variables

## 📱 **Custom Domain (Optional)**

1. **Add Custom Domain in Vercel**
   - Go to project settings
   - Add your domain
   - Update DNS records

2. **Update Backend CORS**
   - Add your custom domain to CORS_ORIGIN

## 🎯 **Complete Project URLs**

After deployment, you'll have:

- **Frontend**: `https://your-frontend-name.vercel.app`
- **Backend**: `https://your-backend-name.onrender.com`
- **Database**: PostgreSQL on Render (Singapore)

## 📊 **Monitoring**

- **Vercel Analytics**: Built-in performance monitoring
- **Render Logs**: Backend and database logs
- **Error Tracking**: Set up error monitoring for production

## 🔄 **Continuous Deployment**

Both Vercel and Render will automatically redeploy when you push to GitHub:
- Push to `main` branch
- Vercel builds and deploys frontend
- Render builds and deploys backend

## 🆘 **Support**

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Render Documentation: [docs.render.com](https://docs.render.com)
- Community: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions) 