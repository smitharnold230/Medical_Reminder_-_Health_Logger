# Render Backend Deployment Checklist

## ✅ Pre-Deployment Checklist

- [ ] Code is committed to GitHub
- [ ] Repository is connected to Render
- [ ] Root directory is set to `backend`
- [ ] Build command: `npm install`
- [ ] Start command: `npm start`

## ✅ Environment Variables Checklist

- [ ] `DATABASE_URL` = `postgresql://admin:X6zmXh7aSTu9YJu3SUIY9IzaRpjJU6n1@dpg-d1kg6bmr433s73chmv8g-a.singapore-postgres.render.com/express_auth`
- [ ] `JWT_SECRET` = `healthtracker_super_secret_jwt_key_2024_secure_production_ready`
- [ ] `NODE_ENV` = `production`
- [ ] `CORS_ORIGIN` = `*`
- [ ] `PORT` = `10000`

## ✅ Post-Deployment Verification

### 1. Check Service Status
- [ ] Service shows "Live" status
- [ ] No build errors in logs
- [ ] Application starts successfully

### 2. Test Database Connection
Your backend URL will be: `https://your-service-name.onrender.com`

Test these endpoints:
- [ ] `GET /api/health` (if you have a health check)
- [ ] `GET /` (should show server is running)

### 3. Setup Database Schema
After deployment, you can run the database setup:
- [ ] Database tables are created
- [ ] No schema errors

### 4. Test API Endpoints
- [ ] Registration: `POST /api/register`
- [ ] Login: `POST /api/login`
- [ ] Other endpoints work correctly

## 🔧 Troubleshooting

### Common Issues:

1. **Build Fails**
   - Check if all dependencies are in package.json
   - Verify Node.js version compatibility

2. **Database Connection Fails**
   - Verify DATABASE_URL is correct
   - Check if database is accessible

3. **Application Crashes**
   - Check logs for error messages
   - Verify environment variables are set

4. **CORS Errors**
   - Update CORS_ORIGIN to your frontend URL
   - Or use `*` for development

## 📞 Next Steps

After successful deployment:
1. Update frontend to use your backend URL
2. Deploy frontend
3. Test complete application
4. Set up monitoring and logging

## 🆘 Getting Help

- Render Logs: Check the "Logs" tab in your service
- Render Documentation: [docs.render.com](https://docs.render.com)
- Community: [community.render.com](https://community.render.com) 