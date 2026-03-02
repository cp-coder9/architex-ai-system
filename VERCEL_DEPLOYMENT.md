# Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the Kimi Agent Freelancer Admin Dashboard to Vercel.

## Prerequisites

- [Vercel Account](https://vercel.com/signup) (free tier available)
- [Node.js](https://nodejs.org/) (v20 or higher recommended)
- [Firebase Project](https://console.firebase.google.com/) configured
- Project code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Quick Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository

2. **Configure Project**
   - Framework Preset: Select `Vite`
   - Build Command: `npm run build` (already configured in vercel.json)
   - Output Directory: `dist` (already configured)
   - Root Directory: `./` (if project is at repo root)

3. **Environment Variables**
   Add the following environment variables in the Vercel dashboard:

   | Variable | Description | Example |
   |----------|-------------|---------|
   | `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSy...` |
   | `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `your-project.firebaseapp.com` |
   | `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `your-project-id` |
   | `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `your-project.appspot.com` |
   | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | `123456789` |
   | `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123456789:web:abcdef` |

   To get these values:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > General > Your apps
   - Click the web app icon (</>)
   - Copy the configuration values

4. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at the provided URL

### Option 2: Deploy via CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # Deploy to preview environment
   npm run vercel:preview
   
   # Or deploy to production
   npm run vercel:deploy
   ```

4. **Set Environment Variables via CLI**
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_AUTH_DOMAIN
   vercel env add VITE_FIREBASE_PROJECT_ID
   vercel env add VITE_FIREBASE_STORAGE_BUCKET
   vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
   vercel env add VITE_FIREBASE_APP_ID
   ```

## Configuration Files

### vercel.json

The `vercel.json` file in the project root contains all deployment configurations:

- **Build Settings**: Specifies build command and output directory
- **SPA Routing**: Configures rewrite rules for client-side routing
- **Security Headers**: Adds security headers to all responses
- **Caching**: Configures cache headers for static assets
- **Environment Variables**: References to secrets stored in Vercel

### vite.config.ts

Updated for production builds with:
- Optimized chunk splitting for vendor libraries
- Source maps for development, minification for production
- Correct base path for Vercel deployment

## Build Configuration

### Local Build Test

Before deploying, test the build locally:

```bash
# Build the project
npm run build

# Preview the production build
npm run preview
```

The preview server will start at `http://localhost:4173`

### Build Output

- Build output directory: `dist/`
- Static assets are served from `dist/assets/`
- `index.html` is the entry point for all routes (SPA)

## Post-Deployment Steps

### 1. Configure Firebase Authentication

Ensure Firebase Authentication is configured with the deployed domain:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Authentication > Settings > Authorized domains
3. Add your Vercel deployment URL:
   - Production: `https://your-project.vercel.app`
   - Preview deployments: `https://*.vercel.app`

### 2. Configure Firebase Firestore Rules

Ensure Firestore security rules allow access from the deployed app:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Configure Firebase Storage Rules

Ensure Storage security rules are configured:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Custom Domain (Optional)

To use a custom domain:

1. Go to your project settings in Vercel Dashboard
2. Click "Domains"
3. Add your custom domain
4. Follow the DNS configuration instructions

## Troubleshooting

### Build Failures

1. **Check Node.js version**: Ensure Node.js 20+ is used
   ```bash
   node --version
   ```

2. **Clear build cache**: Redeploy without cache
   ```bash
   vercel --force
   ```

3. **Check environment variables**: Verify all required variables are set

### Runtime Errors

1. **404 on refresh**: Ensure `vercel.json` rewrite rules are configured
2. **Firebase errors**: Verify environment variables are correctly set
3. **Blank page**: Check browser console for JavaScript errors

### Environment Variables Not Loading

- Vite only exposes env variables prefixed with `VITE_`
- Ensure variables are set in Vercel Dashboard under Project Settings > Environment Variables
- Redeploy after adding/updating environment variables

## Continuous Deployment

Vercel automatically deploys when you push to your Git repository:

- **Production**: Pushes to the main/production branch deploy to production
- **Preview**: Pushes to other branches create preview deployments

To configure:
1. Go to Project Settings > Git
2. Configure production branch (usually `main` or `master`)
3. Toggle "Auto-expose System Environment Variables" if needed

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to Git
2. **Firebase Rules**: Ensure Firestore and Storage rules restrict access appropriately
3. **API Keys**: Firebase API keys are public, but ensure Firestore rules protect data
4. **Security Headers**: Already configured in `vercel.json`

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Yes | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Firebase authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Firebase project identifier |
| `VITE_FIREBASE_STORAGE_BUCKET` | Yes | Firebase storage bucket URL |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase Cloud Messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Yes | Firebase web app ID |

## Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [Firebase Web Setup](https://firebase.google.com/docs/web/setup)

## Migration from Netlify

If migrating from Netlify:

1. Environment variables have been copied from `netlify.toml`
2. Redirect rules have been converted to Vercel rewrites
3. Headers configuration has been preserved
4. Build settings remain the same (`npm run build`, `dist/` output)

The main differences:
- `netlify.toml` → `vercel.json`
- Netlify redirects → Vercel rewrites
- Netlify environment contexts → Vercel environment variables
