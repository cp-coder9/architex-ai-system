# Cloudflare R2 CORS Configuration

## Problem
File uploads are failing with CORS errors:
```
Access to fetch at 'https://architex.fce57ea059c228c5cec72d0b7055c268.r2.cloudflarestorage.com/...' 
from origin 'https://architex-ai-system-1.vercel.app' has been blocked by CORS policy
```

## Solution
Configure CORS on your Cloudflare R2 bucket to allow requests from your Vercel domain.

### Option 1: Using Cloudflare Dashboard (Recommended)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Go to **R2** > **Your Buckets**
3. Select your bucket (likely named `architex`)
4. Click on the **CORS** tab
5. Click **Add CORS rule**
6. Configure with these settings:
   - **Allowed origins**: 
     - `https://architex-ai-system-1.vercel.app`
     - `https://*.vercel.app`
     - `http://localhost:5173`
   - **Allowed methods**: GET, PUT, POST, DELETE, HEAD
   - **Allowed headers**: `*`
   - **Expose headers**: ETag, x-amz-request-id, x-amz-id-2
   - **Max age**: 3000

7. Click **Save**

### Option 2: Using Wrangler CLI

1. Install Wrangler if not already installed:
   ```bash
   npm install -g wrangler
   ```

2. Authenticate with Cloudflare:
   ```bash
   wrangler login
   ```

3. Apply the CORS configuration from the provided `r2-cors-config.json`:
   ```bash
   wrangler r2 bucket cors update architex --config=r2-cors-config.json
   ```

   Or manually:
   ```bash
   wrangler r2 bucket cors add architex \
     --allowed-origins "https://architex-ai-system-1.vercel.app" "https://*.vercel.app" "http://localhost:5173" \
     --allowed-methods "GET" "PUT" "POST" "DELETE" "HEAD" \
     --allowed-headers "*" \
     --expose-headers "ETag" "x-amz-request-id" "x-amz-id-2" \
     --max-age 3000
   ```

### Option 3: Using Cloudflare API

```bash
curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/YOUR_ACCOUNT_ID/r2/buckets/architex/cors" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "CorsRules": [
      {
        "AllowedOrigins": [
          "https://architex-ai-system-1.vercel.app",
          "https://*.vercel.app",
          "http://localhost:5173"
        ],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
        "AllowedHeaders": ["*"],
        "ExposeHeaders": ["ETag", "x-amz-request-id", "x-amz-id-2"],
        "MaxAgeSeconds": 3000
      }
    ]
  }'
```

## Verification

After applying the CORS configuration:

1. Clear your browser cache
2. Try uploading a file again
3. Check the browser console - the CORS error should be gone
4. Verify the file uploads successfully to R2

## Notes

- The CORS configuration may take a few minutes to propagate
- Make sure to include all your deployment domains (production, preview, development)
- For security, only include origins you trust
- The `MaxAgeSeconds` controls how long browsers can cache the CORS preflight response

## Related Files

- `src/services/r2StorageService.ts` - R2 storage service implementation
- `src/store/fileStore.ts` - File store state management
- `r2-cors-config.json` - CORS configuration in JSON format
