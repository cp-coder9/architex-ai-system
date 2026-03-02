# Firebase Setup Guide

Complete guide for setting up Firebase integration with the Architex Axis dashboard.

## Table of Contents

- [Overview](#overview)
- [Creating a Firebase Project](#creating-a-firebase-project)
- [Enabling Authentication](#enabling-authentication)
- [Setting Up Firestore](#setting-up-firestore)
- [Enabling Storage](#enabling-storage)
- [Getting Configuration Values](#getting-configuration-values)
- [Security Rules](#security-rules)
- [Local Emulator Setup](#local-emulator-setup)
- [Troubleshooting](#troubleshooting)

---

## Overview

The application supports two modes:
1. **Mock Mode** (default) - Runs without Firebase, using in-memory data
2. **Firebase Mode** - Uses real Firebase services for authentication, database, and storage

---

## Creating a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter a project name (e.g., "architex-axis")
4. Choose whether to enable Google Analytics (optional)
5. Accept terms and create the project

---

## Enabling Authentication

1. In Firebase Console, go to **Build > Authentication**
2. Click **Get started**
3. Enable **Email/Password** provider:
   - Click "Email/Password"
   - Toggle "Enable"
   - Save

---

## Setting Up Firestore

1. Go to **Build > Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (recommended) or **Start in test mode**
4. Select a location closest to your users (e.g., `europe-west` for South Africa)
5. Click **Enable**

### Required Collections

The application uses these collections (created automatically on first use):
- `users` - User profiles
- `projects` - Project data
- `drawings` - Drawing metadata
- `invoices` - Invoice records
- `timeEntries` - Time tracking entries
- `comments` - Project comments
- `notifications` - User notifications
- `agentConfigs` - AI agent configurations
- `agentLogs` - Agent activity logs

---

## Enabling Storage

1. Go to **Build > Storage**
2. Click **Get started**
3. Choose **Start in production mode** or **Start in test mode**
4. Select the same location as Firestore
5. Click **Done**

---

## Getting Configuration Values

1. In Firebase Console, click the **gear icon** ⚙️ → **Project settings**
2. Scroll to **Your apps** section
3. If no web app exists, click **</> Create web app**
4. Copy the `firebaseConfig` object values

### Configuration Mapping

| Firebase Config Key | Environment Variable |
|---------------------|---------------------|
| `apiKey` | `VITE_FIREBASE_API_KEY` |
| `authDomain` | `VITE_FIREBASE_AUTH_DOMAIN` |
| `projectId` | `VITE_FIREBASE_PROJECT_ID` |
| `storageBucket` | `VITE_FIREBASE_STORAGE_BUCKET` |
| `messagingSenderId` | `VITE_FIREBASE_MESSAGING_SENDER_ID` |
| `appId` | `VITE_FIREBASE_APP_ID` |

### Setting Environment Variables

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=AIzaSyB...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123def456
```

**Important**: Variables must start with `VITE_` for Vite to expose them to the browser.

---

## Security Rules

### Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Projects - access based on role
    match /projects/{projectId} {
      allow read: if request.auth != null && (
        resource.data.clientId == request.auth.uid ||
        resource.data.freelancerId == request.auth.uid ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
      allow write: if request.auth != null && (
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
      );
    }
    
    // Default deny
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to read/write their own files
    match /drawings/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Local Emulator Setup

For local development with Firebase emulators:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize emulators:
   ```bash
   firebase init emulators
   ```
   - Select Authentication, Firestore, and Storage emulators
   - Choose ports (defaults are fine)

4. Start emulators:
   ```bash
   firebase emulators:start
   ```

5. Enable emulator mode in `.env`:
   ```env
   VITE_USE_FIREBASE_EMULATOR=true
   ```

---

## Troubleshooting

### "Firebase not configured" Warning

This is expected in mock mode. To use Firebase, ensure all environment variables are set.

### "Permission denied" Errors

Check Firestore rules. In development, you can use test mode rules:

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

### Authentication Domain Not Authorized

Add your domain to Firebase authorized domains:
1. Firebase Console → Authentication → Settings → Authorized domains
2. Add your domain (e.g., `localhost`, `your-site.netlify.app`)

### CORS Errors

For Storage, ensure CORS is configured:
```bash
gsutil cors set cors.json gs://your-bucket
```

Create `cors.json`:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT"],
    "maxAgeSeconds": 3600
  }
]
```

---

## Testing Firebase Connection

Use the debug page at `/debug` to test:
- Firebase configuration status
- Firestore connectivity
- Authentication status
- Storage availability

Or use the Firebase Tester component in the developer tools.

---

## Migration from Mock Mode to Firebase

1. Set up Firebase project (see above)
2. Add environment variables
3. Restart development server
4. The app will automatically detect Firebase and switch modes
5. Existing mock data will be cleared (localStorage only)

---

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Storage Rules](https://firebase.google.com/docs/storage/security)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
