# Firebase Setup Instructions for CashPilot

## Step 1: Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project or select existing one
3. Add a Web App to your project

## Step 2: Enable Services

### Authentication:
1. Go to Authentication → Sign-in method
2. Enable "Email/Password" provider
3. Save changes

### Firestore Database:
1. Go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select your preferred location
5. Click "Done"

## Step 3: Get Configuration

1. Go to Project Settings (gear icon)
2. Scroll down to "Your apps" section
3. Copy the Firebase config object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Step 4: Update Your App

Replace the placeholder config in `src/firebase/config.js` with your actual Firebase configuration.

## Step 5: Security Rules (Important!)

Go to Firestore Database → Rules and replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /{collection}/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Allow users to create their own documents
    match /{collection}/{document} {
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## Step 6: Domain Authorization

1. Go to Authentication → Settings → Authorized domains
2. Add your GitHub Pages domain: `marius1994r.github.io`
3. Also add `localhost` for local development

## That's it! 🎉

Your app will now have:
- ✅ User authentication
- ✅ Real-time database
- ✅ Secure data access
- ✅ Live online deployment

## Testing Your Setup

1. Visit your deployed app at: `https://marius1994r.github.io/cashPilot/`
2. Create an account
3. Add some transactions
4. Check Firestore console to see your data

## Need Help?

If you encounter any issues:
1. Check browser console for errors
2. Verify Firebase config is correct
3. Ensure Firestore rules allow your operations
4. Make sure Authentication is enabled