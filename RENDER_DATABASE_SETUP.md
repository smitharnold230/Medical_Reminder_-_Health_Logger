# Render PostgreSQL Database Setup Guide

## Overview
This guide walks you through setting up a PostgreSQL database on Render for the Medical Reminder - Health Logger application.

---

## Step 1: Create a Render Account

1. Go to **https://render.com**
2. Click **"Sign up"** (or sign in if you have an account)
3. Choose to sign up with **GitHub** (recommended - easier deployment)
4. Authorize Render to access your GitHub account
5. Complete the signup process

---

## Step 2: Create PostgreSQL Database

### 2.1 Navigate to Render Dashboard

1. Log into your Render dashboard: **https://dashboard.render.com**
2. Click the **"New+"** button in the top right corner
3. Select **"PostgreSQL"** from the menu

### 2.2 Configure Database Settings

Fill in the following details:

| Field | Value | Description |
|-------|-------|-------------|
| **Name** | `health-logger-db` | Any name you prefer for your database service |
| **Database** | `healthtracker` | Must match your schema database name |
| **User** | `healthtracker_user` | Database user - remember this for connections |
| **Region** | Your closest region (e.g., `Ohio`) | Lower latency for better performance |
| **PostgreSQL Version** | `15` | Latest stable version available |

### 2.3 Create the Database

1. Click the **"Create Database"** button
2. Render will provision the database - **Wait 5-10 minutes**
3. You'll see a confirmation when the database is ready

---

## Step 3: Save Database Connection Details

Once the database is created, you'll see a dashboard with connection information:

### 3.1 Important Connection Details

Copy and **SAVE THESE CREDENTIALS SECURELY**:

```
External Database URL: postgresql://healthtracker_user:PASSWORD@your-db-host.postgres.render.com:5432/healthtracker
Internal Database URL: (for services within Render)
Host: your-db-host.postgres.render.com
Database: healthtracker
User: healthtracker_user
Password: (your secure password)
Port: 5432
```

**⚠️ IMPORTANT:** 
- **Never share your password** - it's sensitive!
- **Save the External Database URL** - you'll need it for your backend
- **Keep these credentials** - you'll use them to initialize the schema

---

## Step 4: Initialize Database Schema

### Option A: Using Render's Web Console (EASIEST)

1. In your Render database dashboard, click **"Connect"**
2. Click **"PSQL"** tab
3. Copy the provided command that looks like:
   ```bash
   PGPASSWORD=yourpassword psql -h your-db-host.postgres.render.com -U healthtracker_user -d healthtracker
   ```
4. Paste and run this command in your terminal

### Option B: Using psql Command Line

1. Make sure you have PostgreSQL client tools installed:
   ```bash
   # On Windows (using choco)
   choco install postgresql

   # On macOS
   brew install postgresql
   ```

2. Connect to your database:
   ```bash
   psql postgresql://healthtracker_user:PASSWORD@your-db-host.postgres.render.com:5432/healthtracker
   ```

### Option C: Using Backend Setup Script

1. Update your local backend `environment.env` file:
   ```
   DATABASE_URL=postgresql://healthtracker_user:PASSWORD@your-db-host.postgres.render.com:5432/healthtracker
   ```

2. Run the setup script:
   ```bash
   cd backend
   npm install
   npm run setup-db
   ```

---

## Step 5: Load the Database Schema

### Using the Database URL

Once connected via any of the above methods, run your schema SQL:

**Option 1: Using SQL file**
```sql
\i backend/schema.sql
```

**Option 2: Copy-paste SQL**
- Open `backend/schema.sql` file
- Copy all the SQL content
- Paste it into the psql terminal
- Press Enter to execute

### Verify Schema Was Created

Run these commands to verify:

```sql
-- List all tables
\dt

-- Check users table
\d users

-- Check medications table
\d medications

-- Count tables (should be 5+)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
```

Expected output:
```
 count
-------
     5
(1 row)
```

Tables that should exist:
- `users`
- `medications`
- `health_metrics`
- `appointments`
- `notification_settings`

---

## Step 6: Test Database Connection

### Test 1: Connection String

Verify your connection string works:
```bash
psql postgresql://healthtracker_user:PASSWORD@your-db-host.postgres.render.com:5432/healthtracker -c "SELECT NOW();"
```

Expected output: Shows current timestamp

### Test 2: Insert Test Data

```sql
-- Insert test user
INSERT INTO users (username, email, password_hash, created_at) 
VALUES ('testuser', 'test@example.com', 'hash', NOW());

-- Verify insertion
SELECT * FROM users WHERE username = 'testuser';
```

### Test 3: Query Data

```sql
-- Check if tables are properly set up
SELECT * FROM users LIMIT 1;
SELECT * FROM medications LIMIT 1;
SELECT * FROM health_metrics LIMIT 1;
```

---

## Step 7: Set Up Database Backups

### Enable Automatic Backups

1. Go to your database settings in Render
2. Look for **"Backups"** or **"Snapshots"** section
3. Enable automatic backups
4. Backups are automatically retained (typically 7-30 days)

---

## Common Issues & Solutions

### Issue 1: "Connection Refused"

**Problem:** Can't connect to the database
```
psql: error: could not connect to server: Connection refused
```

**Solutions:**
- Verify the host, port, and credentials are correct
- Check that the database is running (should show "Available" in Render)
- Wait a few minutes - sometimes the database takes time to stabilize
- Check your firewall/network settings

### Issue 2: "Password Authentication Failed"

**Problem:** Wrong password
```
psql: error: FATAL: password authentication failed
```

**Solutions:**
- Copy the password again from Render carefully
- Check for special characters that need escaping
- Reset the password in Render dashboard if needed

### Issue 3: "Database Does Not Exist"

**Problem:** Specified database not found
```
psql: error: FATAL: database "healthtracker" does not exist
```

**Solutions:**
- Verify database name is spelled correctly
- Check it matches what you created (case-sensitive)
- Run schema initialization again

### Issue 4: "Relation Does Not Exist"

**Problem:** Tables haven't been created
```
ERROR: relation "users" does not exist
```

**Solutions:**
- Run the schema.sql file again
- Verify you're connected to the correct database
- Check that the SQL commands executed without errors

---

## Next Steps

Once your database is ready:

1. ✅ **Note the External Database URL** - you'll use this for your backend
2. ✅ **Configure your backend** - Add DATABASE_URL to environment variables
3. ✅ **Deploy backend** - See `RENDER_BACKEND_DEPLOYMENT.md`
4. ✅ **Monitor database** - Check Render dashboard for performance metrics

---

## Quick Reference

### Connection Details Template
```
External Database URL:
postgresql://healthtracker_user:YOUR_PASSWORD@YOUR_HOST.postgres.render.com:5432/healthtracker

For use in environment variables as DATABASE_URL
```

### Common Commands

```bash
# Connect via psql
psql postgresql://healthtracker_user:PASSWORD@HOST:5432/healthtracker

# List all databases
\l

# Connect to specific database
\c healthtracker

# List all tables
\dt

# Describe table structure
\d users

# Exit psql
\q

# Backup database
pg_dump postgresql://healthtracker_user:PASSWORD@HOST:5432/healthtracker > backup.sql

# Restore database
psql postgresql://healthtracker_user:PASSWORD@HOST:5432/healthtracker < backup.sql
```

---

## Security Best Practices

1. **Never commit credentials** - Use .gitignore for environment files
2. **Use strong passwords** - Render generates these automatically
3. **Rotate passwords periodically** - Do this in Render dashboard
4. **Limit connections** - Only from your backend service
5. **Use HTTPS/SSL** - Render uses encrypted connections by default
6. **Monitor access logs** - Check for suspicious activity

---

## Support & Resources

- **Render Documentation:** https://render.com/docs/databases
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/
- **Connection Issues:** Check Render status page for outages

---

**Status:** Ready for Backend Deployment ✓
