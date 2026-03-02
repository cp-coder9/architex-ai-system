# Netlify Deployment Guide

This guide covers deploying the Freelancer Project Admin Dashboard to Netlify.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Deploy](#quick-deploy)
- [Environment Variables](#environment-variables)
- [Configuration Details](#configuration-details)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before deploying, ensure you have:

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Firebase Project**: Created and configured with Authentication and Firestore
3. **Git Repository**: Code pushed to GitHub, GitLab, or Bitbucket

---

## Quick Deploy

### Option 1: Git-Based Deployment (Recommended)

1. **Connect Repository**:
   - Log in to Netlify Dashboard
   - Click "Add new site" → "Import an existing project"
   - Select your Git provider and repository

2. **Configure Build Settings**:
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Deploy**: Click "Deploy site"

### Option 2: Manual Deploy

1. Run build locally:
   ```bash
   npm run build
   ```

2. Drag and drop the `dist/` folder to Netlify's deploy dropzone

---

## Environment Variables

### Required Firebase Variables

Add these in **Site Settings → Environment Variables**:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSyB...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Project ID | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | App ID | `1:123:web:abc...` |

### Getting Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click the gear icon → Project Settings
4. Under "Your apps", select the web app (or create one)
5. Copy the `firebaseConfig` values to Netlify environment variables

### Important Notes

- **Variable Prefix**: All Firebase env vars must start with `VITE_` to be accessible in the browser
- **Mock Mode**: If Firebase env vars are not set, the app runs in mock mode with demo data
- **Production vs Preview**: You can set different values for production and deploy previews

---

## Configuration Details

### `netlify.toml`

Located at project root, this file configures:

- **Build settings**: Command and output directory
- **SPA redirects**: All routes → index.html (200 status)
- **Security headers**: XSS, frame options, CSP
- **Caching**: Aggressive caching for static assets

### `public/_redirects`

Backup redirects file (copied to dist during build):
```
/*    /index.html   200
```

### SPA Routing

React Router requires special handling on Netlify:

- All routes serve `index.html` (200 status, not 301/302)
- Client-side routing takes over after page load
- Deep links work correctly (e.g., `/dashboard/projects/123`)

---

## Post-Deployment Checklist

### Immediate Checks

- [ ] Site loads without 404 errors
- [ ] Navigation between pages works
- [ ] Refresh on any route works correctly
- [ ] Login with mock credentials works:
  - Admin: `admin@archflow.com` / `admin123`
  - Client: `client@example.com` / `client123`
  - Freelancer: `freelancer@example.com` / `freelancer123`

### Firebase Integration (if configured)

- [ ] Real authentication works
- [ ] Firestore data loads
- [ ] File uploads work (if Storage is configured)

### Security

- [ ] HTTPS is enabled (default on Netlify)
- [ ] Security headers are present (check in DevTools)
- [ ] No sensitive data in build output

### Performance

- [ ] First load is reasonable (< 5s on 3G)
- [ ] Static assets are cached
- [ ] No console errors

---

## Troubleshooting

### "Page Not Found" on Refresh

**Problem**: Refreshing a route shows 404

**Solution**: 
- Verify `netlify.toml` has the redirect rule
- Check that `public/_redirects` exists
- Ensure build output includes `_redirects` in dist/

### Firebase Not Working

**Problem**: Authentication or Firestore fails

**Solution**:
- Verify all `VITE_FIREBASE_*` env vars are set
- Check Firebase console for authorized domains (add Netlify URL)
- Ensure Firebase project has Authentication enabled
- Check browser console for specific errors

### Blank Page After Deploy

**Problem**: Site shows blank page

**Solution**:
- Check browser console for errors
- Verify build completed successfully
- Check that `dist/index.html` exists and references correct JS/CSS files
- Ensure `vite.config.ts` has correct `base` setting

### Environment Variables Not Working

**Problem**: App behaves as if env vars aren't set

**Solution**:
- Variables must start with `VITE_` for Vite to expose them
- Re-deploy after adding/updating env vars
- Check that variables are in the correct context (production vs preview)

### Build Fails

**Problem**: Netlify build fails

**Solution**:
- Check build logs for TypeScript errors
- Ensure Node.js version is compatible (set in netlify.toml)
- Run `npm run build` locally to verify

---

## Advanced Configuration

### Custom Domain

1. In Netlify: Domain Settings → Add custom domain
2. Configure DNS as instructed
3. Update Firebase authorized domains with your custom domain

### Branch Deploys

Netlify automatically creates deploy previews for Pull Requests. Each branch gets its own URL.

### Environment-Specific Settings

You can override settings per context in `netlify.toml`:

```toml
[context.production]
  command = "npm run build"

[context.deploy-preview]
  command = "npm run build:staging"
```

---

## Support

- **Netlify Docs**: [docs.netlify.com](https://docs.netlify.com)
- **Firebase Docs**: [firebase.google.com/docs](https://firebase.google.com/docs)
- **Vite Docs**: [vitejs.dev/guide](https://vitejs.dev/guide)

---

## Deployment Summary

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Publish Directory | `dist` |
| Node Version | 20 |
| SPA Redirects | Configured |
| Security Headers | Configured |
| Cache Headers | Configured |