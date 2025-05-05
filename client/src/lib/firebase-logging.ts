// First, we need to create a utility function to log actions to Firebase
// Create a new file: src/lib/firebase/logAction.ts

import { collection, addDoc } from "firebase/firestore";

declare global {
  interface Window {
    sessionId?: string;
  }
}
import { db } from "./firebase.config";

type UserAction = {
  action: string;
  name: string;
  timestamp: number;
  timestampReadable: string; // ISO format timestamp
  sessionId: string;
  environment: string;
  userAgent: string;
  userId?: string;
  additionalData?: Record<string, any>;
};

/**
 * Logs a user action to Firebase Firestore
 * @param action The type of action (e.g., 'click', 'view', 'submit')
 * @param name The name or description of the action
 * @param additionalData Any additional data to log with the action
 * @returns Promise that resolves when the action is logged
 */
export const logUserAction = async (
  action: string,
  name: string,
  additionalData?: Record<string, any>,
  userId?: string
): Promise<void> => {
  try {
    // Generate a session ID if not already created
    if (!window.sessionId) {
      window.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    const userActionData: UserAction = {
      action,
      name,
      timestamp: Date.now(),
      timestampReadable: new Date().toISOString(), // Add human-readable timestamp
      sessionId: window.sessionId,
      environment: import.meta.env.MODE, // 'development' or 'production'
      userAgent: navigator.userAgent,
      ...(userId && { userId }), // Only add userId if it's provided
      ...(additionalData && { additionalData }), // Only add additionalData if it's provided
    };

    await addDoc(collection(db, "user_actions"), userActionData);
    console.log("User action logged successfully");
  } catch (error) {
    console.error("Error logging user action:", error);
  }
};
