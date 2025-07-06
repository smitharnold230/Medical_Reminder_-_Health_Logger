# Render Deployment Guide for MedHel

This guide will help you deploy your MedHel application on Render platform.

## Prerequisites

1. A GitHub repository with your code
2. A Render account (free tier available)

## Step 1: Database Setup

### Create PostgreSQL Database on Render

1. **Go to Render Dashboard**
   - Visit [render.com](https://render.com)
   - Sign in to your account

2. **Create New PostgreSQL Service**
   - Click "New +" button
   - Select "PostgreSQL"
   - Choose a name (e.g., "medhel-database")
   - Select your preferred region
   - Choose the free plan (or paid if needed)
   - Click "Create Database"

3. **Get Database URL**
   - Once created, go to your database service
   - Copy the "External Database URL" 
   - It will look like: `postgres://user:password@host:port/dbname`

## Step 2: Backend Service Setup

### Create Web Service for Backend

1. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"
   - Connect your GitHub repository

2. **Configure Service Settings**
   - **Name**: `medhel-backend` (or your preferred name)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (or paid if needed)

3. **Set Environment Variables**
   Click "Environment" tab and add these variables:

   ```
   DATABASE_URL=postgresql://admin:X6zmXh7aSTu9YJu3SUIY9IzaRpjJU6n1@dpg-d1kg6bmr433s73chmv8g-a.singapore-postgres.render.com/express_auth
   JWT_SECRET=your_super_secret_jwt_key_here
   NODE_ENV=production
   CORS_ORIGIN=https://your-frontend-url.com
   PORT=10000
   ```

   **Important Notes:**
   - Replace `postgres://user:password@host:port/dbname` with your actual database URL from Step 1
   - Generate a strong JWT_SECRET (you can use a password generator)
   - Set CORS_ORIGIN to your frontend URL (or `*` for development)

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy your backend

## Step 3: Database Schema Setup

After your backend is deployed, you need to set up the database schema:

1. **Get your backend URL**
   - Your backend will be available at: `https://your-service-name.onrender.com`

2. **Run Schema Setup**
   - You can either:
     - Use the `/api/check-schema` endpoint if you have one
     - Or manually run the SQL from `schema.sql` in your database

## Step 4: Frontend Configuration

Update your frontend to point to your Render backend:

1. **Update API Configuration**
   In your frontend `src/config.js` or wherever you configure the API base URL:

   ```javascript
   // Change from localhost to your Render backend URL
   const API_BASE_URL = 'https://your-backend-service-name.onrender.com';
   ```

2. **Deploy Frontend**
   - You can deploy your frontend on Render as well
   - Or use other platforms like Vercel, Netlify, etc.

## Environment Variables Reference

### Required for Production
```
DATABASE_URL=postgresql://admin:X6zmXh7aSTu9YJu3SUIY9IzaRpjJU6n1@dpg-d1kg6bmr433s73chmv8g-a.singapore-postgres.render.com/express_auth
JWT_SECRET=your_super_secret_jwt_key_here
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.com
```

### Optional (have defaults)
```
PORT=10000
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=12
LOG_LEVEL=info
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check if DATABASE_URL is correct
   - Ensure database is created and running
   - Check if SSL is properly configured

2. **CORS Errors**
   - Verify CORS_ORIGIN is set correctly
   - Make sure frontend URL matches exactly

3. **Build Failures**
   - Check if all dependencies are in package.json
   - Ensure Node.js version is compatible

### Checking Logs

1. **Backend Logs**
   - Go to your backend service on Render
   - Click "Logs" tab
   - Check for any error messages

2. **Database Logs**
   - Go to your database service on Render
   - Click "Logs" tab
   - Check for connection issues

## Security Notes

1. **Never commit sensitive data**
   - Keep environment variables secure
   - Don't commit `.env` files to Git

2. **Use strong secrets**
   - Generate strong JWT_SECRET
   - Use different secrets for different environments

3. **Enable HTTPS**
   - Render provides HTTPS by default
   - Ensure your frontend also uses HTTPS

## Cost Optimization

1. **Free Tier Limits**
   - Free tier has usage limits
   - Services may sleep after inactivity
   - Consider paid plans for production

2. **Database Optimization**
   - Monitor database usage
   - Optimize queries for better performance

## Next Steps

1. Test your deployed application
2. Set up monitoring and logging
3. Configure custom domain (optional)
4. Set up CI/CD pipeline (optional)

## Support

- Render Documentation: [docs.render.com](https://docs.render.com)
- Render Community: [community.render.com](https://community.render.com) 