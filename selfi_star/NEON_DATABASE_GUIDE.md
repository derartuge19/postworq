# 🔍 Neon Database Verification Guide

## 📋 How to Check if Your App is Using Neon

### **Method 1: Run the Database Checker Script**
```bash
cd selfi_star/backend
python check_neon_connection.py
```

This script will:
- ✅ Test database connection
- ✅ Show database version and name
- ✅ List all tables
- ✅ Show row counts
- ✅ Run migrations if needed

### **Method 2: Check Django Admin**
1. Go to: `https://postworq.onrender.com/admin/`
2. Login with superuser credentials
3. Look for database tables in the admin interface

### **Method 3: Check Neon Console Directly**
1. Go to: https://console.neon.tech/app/projects/flat-thunder-79099653
2. Click on **"Tables"** tab
3. Look for these Django tables:
   - `auth_user` (Users)
   - `api_userprofile` (User profiles)
   - `api_reel` (Videos/posts)
   - `django_migrations` (Migration history)

### **Method 4: Check Render Environment Variables**
1. Go to Render dashboard → postworq service
2. Click **"Environment"** tab
3. Verify these variables:
   ```
   DB_NAME=neondb
   DB_USER=neondb_owner
   DB_HOST=flat-thunder-79099653.aws.neon.tech
   DB_PASSWORD=npg_Ck3JqV2u5m1x
   ```

## 🔧 Common Issues & Solutions

### **Issue: "No tables found in Neon"**
**Solution:** Run migrations
```bash
# On Render (via dashboard or SSH)
cd backend
python manage.py migrate

# Or locally first
python manage.py migrate
```

### **Issue: "Connection refused"**
**Solution:** Check environment variables
- Verify DB_HOST is correct
- Check DB_PASSWORD
- Ensure database is active in Neon

### **Issue: "Authentication failed"**
**Solution:** Check Neon user permissions
- Go to Neon console
- Check user roles and permissions

## 📊 Expected Database Tables

After successful migration, you should see:

### **Django Core Tables:**
- `django_migrations` - Migration history
- `auth_user` - User accounts
- `auth_group` - User groups
- `django_session` - User sessions

### **SelfiStar App Tables:**
- `api_userprofile` - Extended user profiles
- `api_reel` - Video posts
- `api_comment` - Comments on posts
- `api_follow` - User following relationships
- `api_like` - Post likes
- `api_hashtag` - Hashtags
- `api_reel_hashtags` - Post-hashtag relationships

## 🚀 Quick Verification Steps

### **Step 1: Test Connection**
```bash
cd selfi_star/backend
python check_neon_connection.py
```

### **Step 2: If Connected, Run Migrations**
```bash
python manage.py migrate
```

### **Step 3: Create Test Data**
```bash
python manage.py createsuperuser
# Create admin user for testing
```

### **Step 4: Verify in Neon Console**
1. Go to Neon console
2. Click "Tables"
3. You should see all the tables listed above

## 🎯 Success Indicators

✅ **Working Setup:**
- Database connection successful
- All tables created
- Can create users via Django admin
- Frontend can register new users

❌ **Broken Setup:**
- Connection errors
- No tables in Neon
- Frontend registration fails
- Admin panel shows "no such table" errors

## 🆘 If Still Not Working

1. **Check Render logs** for database errors
2. **Verify Neon database is active** (not paused)
3. **Test connection locally** first
4. **Re-run migrations** on Render
5. **Contact Neon support** if database issues persist

---

**Run the checker script now to see exactly what's happening with your database! 🔍**
