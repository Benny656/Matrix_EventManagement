import { initializeApp, getApps, cert, getApp, App, ServiceAccount } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

let adminAppInstance: App | undefined;

export function getFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  if (adminAppInstance) {
    return adminAppInstance;
  }

  let serviceAccount: ServiceAccount | undefined;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON environment variable:", e);
    }
  } else if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || "";
    const privateKey = rawPrivateKey
      .replace(/^"|"$/g, "")
      .replace(/\\n/g, "\n");

    serviceAccount = {
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    };
  }

  if (serviceAccount && serviceAccount.clientEmail && serviceAccount.privateKey) {
    adminAppInstance = initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } else {
    adminAppInstance = initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "matrixevent-1800d",
    });
  }

  return adminAppInstance;
}

// Lazy / safe proxies or getters to prevent top-level module load crashes
export const adminApp = getFirebaseAdminApp();

export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);

export { getFirestore, getAuth };
