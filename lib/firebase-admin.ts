import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // Check if we have the service account key in environment variable
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : undefined;

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('✅ Firebase Admin initialized successfully');
    } else {
      console.warn('⚠️ FIREBASE_SERVICE_ACCOUNT_KEY not found. Push notifications will be disabled.');
    }
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
  }
}

export const firebaseAdmin = admin;
export const messaging = admin.apps.length ? admin.messaging() : null;
