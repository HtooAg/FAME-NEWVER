# Google Cloud Storage Setup Guide

## The Problem

You're getting "Access denied" errors because your Google Cloud Storage bucket and service account don't have the proper permissions configured.

## Solution Steps

### 1. Check Your Service Account Permissions

Your service account needs these IAM roles:

-   `Storage Object Admin` (roles/storage.objectAdmin)
-   `Storage Admin` (roles/storage.admin) - if you need bucket-level operations

### 2. Update Service Account Permissions

#### Option A: Using Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** > **IAM**
3. Find your service account (the one used in your app)
4. Click **Edit** (pencil icon)
5. Click **Add Another Role**
6. Add these roles:
    - `Storage Object Admin`
    - `Storage Admin` (if needed)
7. Click **Save**

#### Option B: Using gcloud CLI

```bash
# Replace YOUR_PROJECT_ID and YOUR_SERVICE_ACCOUNT_EMAIL
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:YOUR_SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.objectAdmin"

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
    --member="serviceAccount:YOUR_SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.admin"
```

### 3. Configure Bucket for Public Access (Required for Downloads)

To allow all users to download and view media files without authentication, you need to make your bucket publicly readable:

#### Option A: Using Google Cloud Console (Recommended)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Storage** > **Buckets**
3. Click on your bucket name
4. Go to **Permissions** tab
5. Click **Grant Access**
6. In "New principals" field, enter: `allUsers`
7. In "Select a role" dropdown, choose: `Storage Object Viewer`
8. Click **Save**
9. Click **Allow Public Access** when prompted

#### Option B: Using gsutil CLI

```bash
# Replace YOUR_BUCKET_NAME with your actual bucket name
gsutil iam ch allUsers:objectViewer gs://YOUR_BUCKET_NAME

# Also remove any "Prevent public access" policy
gsutil bucketpolicyonly set off gs://YOUR_BUCKET_NAME
```

#### Option C: Using gcloud CLI (Recommended for Command Line)

```bash
# Replace YOUR_BUCKET_NAME with your actual bucket name
gcloud storage buckets add-iam-policy-binding gs://YOUR_BUCKET_NAME \
    --member=allUsers \
    --role=roles/storage.objectViewer

# Remove uniform bucket-level access if needed
gcloud storage buckets update gs://YOUR_BUCKET_NAME --no-uniform-bucket-level-access
```

**Important:** After making the bucket public, your files will be accessible to anyone with the URL. This is necessary for downloads to work without authentication.

### 4. Configure CORS for Web Access (Optional but Recommended)

To allow web browsers to access your files directly, configure CORS:

1. Create a file called `cors.json`:

```json
[
	{
		"origin": ["*"],
		"method": ["GET", "HEAD"],
		"responseHeader": ["Content-Type", "Access-Control-Allow-Origin"],
		"maxAgeSeconds": 3600
	}
]
```

2. Apply the CORS configuration:

**Using gsutil:**

```bash
gsutil cors set cors.json gs://YOUR_BUCKET_NAME
```

**Using gcloud (alternative):**

```bash
gcloud storage buckets update gs://YOUR_BUCKET_NAME --cors-file=cors.json
```

### 5. Update Your Environment Variables

Make sure these are set correctly in your `.env.local`:

```env
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket-name
GOOGLE_CLOUD_KEY_FILE=path/to/your/service-account-key.json
```

### 6. Verify Service Account Key File

Make sure your service account key file:

1. Exists at the path specified in `GOOGLE_CLOUD_KEY_FILE`
2. Has the correct permissions (readable by your app)
3. Is valid JSON format
4. Contains the correct project_id

### 7. Test the Setup

You can test if your service account has the right permissions:

```bash
# Test with gsutil (install Google Cloud SDK first)
gsutil ls gs://YOUR_BUCKET_NAME

# Test uploading a file
echo "test" | gsutil cp - gs://YOUR_BUCKET_NAME/test.txt

# Test downloading
gsutil cp gs://YOUR_BUCKET_NAME/test.txt ./test-download.txt
```

### 8. Alternative: Use Application Default Credentials

If you're running on Google Cloud (App Engine, Cloud Run, etc.), you can use Application Default Credentials instead of a service account key file:

1. Remove `GOOGLE_CLOUD_KEY_FILE` from your environment variables
2. Update your Storage initialization:

```typescript
const storage = new Storage({
	projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
	// Remove keyFilename - it will use Application Default Credentials
});
```

### 9. Debugging Steps

If you're still having issues:

1. **Check the exact error message** in your server logs
2. **Verify your service account email** in the Google Cloud Console
3. **Test with a simple gsutil command** to verify permissions
4. **Check if your bucket exists** and is in the right project
5. **Verify your project ID** matches what's in your service account key

### 10. Security Best Practices

-   Don't make your entire bucket public
-   Use signed URLs for temporary access
-   Regularly rotate your service account keys
-   Use least-privilege principle (only grant necessary permissions)
-   Consider using Cloud IAM Conditions for more granular access control

## Quick Fix Commands for Public Access

If you want to quickly make your bucket publicly accessible for downloads (replace with your actual values):

```bash
# Set your variables
PROJECT_ID="your-project-id"
SERVICE_ACCOUNT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
BUCKET_NAME="your-bucket-name"

# Add IAM permissions for service account (for uploads)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
    --role="roles/storage.objectAdmin"

# Make bucket publicly readable (for downloads)
gsutil iam ch allUsers:objectViewer gs://$BUCKET_NAME

# Remove public access prevention (if enabled)
gsutil bucketpolicyonly set off gs://$BUCKET_NAME

# Configure CORS (optional)
echo '[{"origin":["*"],"method":["GET","HEAD"],"responseHeader":["Content-Type","Access-Control-Allow-Origin"],"maxAgeSeconds":3600}]' > cors.json
gsutil cors set cors.json gs://$BUCKET_NAME
rm cors.json
```

After making these changes, restart your application and try downloading again.
