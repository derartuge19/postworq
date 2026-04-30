# Database Migration Instructions for Render

## Issue
The `api_notification` table is missing from the production database, causing 500 errors when users try to follow each other.

## Solution
Run the database migration on your Render backend service.

## Steps to Run Migration on Render

### Option 1: Via Render Dashboard (Recommended)

1. Go to your Render dashboard: https://dashboard.render.com
2. Select your backend service (postworq)
3. Click on the **"Shell"** tab in the left sidebar
4. In the shell terminal, run:
   ```bash
   python manage.py migrate
   ```
5. Wait for the migration to complete
6. You should see output like:
   ```
   Running migrations:
     Applying api.0015_notification... OK
   ```

### Option 2: Via Manual Deploy

1. Go to your Render dashboard
2. Select your backend service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**
4. Render will automatically run migrations during deployment

## Verification

After running the migration, test the follow button on the frontend. It should now work without errors.

## What This Migration Does

Creates the `api_notification` table with the following structure:
- `id` (primary key)
- `recipient` (user receiving the notification)
- `sender` (user who triggered the notification)
- `notification_type` (like, comment, follow, mention)
- `reel` (optional - related reel)
- `comment` (optional - related comment)
- `message` (notification text)
- `is_read` (boolean)
- `created_at` (timestamp)

This table is required for the follow notification system to work properly.
