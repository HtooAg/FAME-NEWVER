# Cloud Run Deployment Fix

## 🔧 **Issues Fixed:**

### **1. Server Configuration**

**File:** `server.js`

**Problem:** Server was binding to `localhost` which doesn't work in Cloud Run
**Solution:** Updated to bind to `0.0.0.0` in production

```javascript
// Before
const hostname = "localhost";

// After
const hostname = dev ? "localhost" : "0.0.0.0";
```

### **2. Dockerfile Updates**

**File:** `Dockerfile`

**Problems:**

-   Missing `server.js` file in production image
-   Missing source files needed for API routes
-   Wrong port exposure

**Solutions:**

```dockerfile
# Added missing files
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/next.config.js ./next.config.js

# Fixed port exposure for Cloud Run
EXPOSE 8080
```

### **3. WebSocket Fallback**

**Files:** API routes

**Problem:** WebSocket might not be available in Cloud Run
**Solution:** Added graceful fallback when `global.io` is not available

```javascript
// Safe WebSocket usage
if (global.io) {
	global.io.to("role_super_admin").emit("new_registration", data);
	console.log("Real-time notification sent");
} else {
	console.log("WebSocket not available, skipping real-time notification");
}
```

## 🚀 **Deployment Steps:**

### **1. Build and Push Docker Image**

```bash
# Build the image
docker build -t gcr.io/fame-468308/fame-app .

# Push to Google Container Registry
docker push gcr.io/fame-468308/fame-app
```

### **2. Deploy to Cloud Run**

```bash
gcloud run deploy fame-app \
  --image gcr.io/fame-468308/fame-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --concurrency 80 \
  --max-instances 10 \
  --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,PORT=8080"
```

### **3. Set Environment Variables**

```bash
gcloud run services update fame-app \
  --region us-central1 \
  --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1"
```

## ⚠️ **Cloud Run Limitations:**

### **WebSocket Considerations:**

-   **Cloud Run supports WebSockets** but with limitations
-   **Connection timeouts** after 60 minutes of inactivity
-   **Scaling behavior** may disconnect WebSocket clients
-   **Load balancing** can affect persistent connections

### **Recommended Approach:**

1. **WebSocket works** for real-time features during active sessions
2. **Fallback mechanisms** ensure app works without WebSocket
3. **Polling fallback** can be added for critical real-time features

## 🔄 **Alternative: Serverless WebSocket**

If WebSocket issues persist, consider:

### **Option 1: Disable WebSocket in Production**

```javascript
// In server.js
const enableWebSocket = process.env.NODE_ENV !== "production";

if (enableWebSocket) {
	// WebSocket setup
	const io = new Server(httpServer, {
		/* config */
	});
	global.io = io;
} else {
	console.log("WebSocket disabled in production");
	global.io = null;
}
```

### **Option 2: Use Google Cloud Pub/Sub**

For production-grade real-time features:

-   **Cloud Pub/Sub** for message broadcasting
-   **Server-Sent Events (SSE)** for real-time updates
-   **Polling** as ultimate fallback

## 🧪 **Testing the Deployment:**

### **1. Local Test with Production Settings**

```bash
# Test locally with production config
NODE_ENV=production PORT=8080 npm start
```

### **2. Docker Test**

```bash
# Build and test Docker image locally
docker build -t fame-app-test .
docker run -p 8080:8080 -e NODE_ENV=production fame-app-test
```

### **3. Cloud Run Test**

```bash
# Test the deployed service
curl https://fame-app-[hash]-uc.a.run.app/api/health
```

## 📋 **Deployment Checklist:**

✅ **Server binds to 0.0.0.0 in production**  
✅ **Dockerfile includes all necessary files**  
✅ **Port 8080 exposed for Cloud Run**  
✅ **WebSocket has graceful fallback**  
✅ **Environment variables set correctly**  
✅ **Build process works without errors**  
✅ **API routes function without WebSocket**

## 🎯 **Expected Results:**

After deployment:

-   ✅ **App starts successfully** on Cloud Run
-   ✅ **API endpoints work** correctly
-   ✅ **Authentication functions** properly
-   ✅ **Database operations** work via GCS
-   ✅ **WebSocket works** when available
-   ✅ **Graceful degradation** when WebSocket unavailable

## 🚀 **Ready to Deploy!**

The application is now configured for Cloud Run deployment with proper WebSocket handling and fallback mechanisms.

### **Deploy Command:**

```bash
gcloud run deploy fame-app \
  --image gcr.io/fame-468308/fame-app \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --timeout 900 \
  --max-instances 10 \
  --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,PORT=8080"
```
