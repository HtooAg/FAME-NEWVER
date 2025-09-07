# Quick Google Cloud Storage Setup

## Current Issue

The emergency broadcasts are failing because Google Cloud Storage is not properly configured.

## Quick Fix Options

### Option 1: Use Existing GCS Project (Recommended)

If you already have a Google Cloud project with a bucket:

1. Update your `.env` file with your actual values:

```bash
GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-actual-bucket-name
GOOGLE_CLOUD_KEY_FILE=path/to/your/service-account-key.json
```

### Option 2: Create New GCS Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Cloud Storage API
4. Create a storage bucket named `fame-data`
5. Create a service account with Storage Admin permissions
6. Download the service account key JSON file
7. Update your `.env` file with the correct paths

### Option 3: Temporary Local Storage (Development Only)

For immediate testing, you can temporarily disable GCS by modifying the emergency broadcasts API to use local storage instead.

## Current Configuration

Your `.env` file now has:

```bash
GOOGLE_CLOUD_PROJECT_ID=your-project-id  # ← Update this
GOOGLE_CLOUD_BUCKET_NAME=fame-data       # ← Update if different
GOOGLE_CLOUD_KEY_FILE=path/to/your/service-account-key.json  # ← Update this
```

## Test Emergency Broadcasts

Once configured, try creating an emergency broadcast from the performance-order page. It should work without the 500 error.

## Need Help?

Check the detailed `GCS_SETUP_GUIDE.md` for complete setup instructions.
