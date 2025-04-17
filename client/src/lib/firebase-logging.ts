// First, we need to create a utility function to log actions to Firebase
// Create a new file: src/lib/firebase/logAction.ts

import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase.config";

type UserAction = {
  action: string;
  name: string;
  timestamp: number;
  userId?: string; // Optional, if you want to track which user performed the action
  additionalData?: Record<string, any>; // Optional, for any extra data you might want to log
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
    const userActionData: UserAction = {
      action,
      name,
      timestamp: Date.now(),
      ...(userId && { userId }), // Only add userId if it's provided
      ...(additionalData && { additionalData }), // Only add additionalData if it's provided
    };

    await addDoc(collection(db, "user_actions"), userActionData);
    console.log("User action logged successfully");
  } catch (error) {
    console.error("Error logging user action:", error);
  }
};
