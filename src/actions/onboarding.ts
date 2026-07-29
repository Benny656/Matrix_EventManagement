"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

export async function completeOnboardingAction(data: { name: string; rollNumber: string; department: string; yearOfStudy: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { status: "error", message: "Unauthorized. Please log in again." };
    }

    const { name, rollNumber, department, yearOfStudy } = data;

    if (!name || !name.trim()) return { status: "error", message: "Name is required." };
    
    const trimmedRollNumber = rollNumber?.trim().toUpperCase();
    if (!trimmedRollNumber) return { status: "error", message: "Roll Number is required." };

    if (!department || !["AI", "AIML"].includes(department)) return { status: "error", message: "Invalid department." };
    if (!yearOfStudy || !["1st Year", "2nd Year", "3rd Year", "4th Year"].includes(yearOfStudy)) return { status: "error", message: "Invalid year of study." };

    // Check for duplicate roll number
    const duplicateCheck = await adminDb.collection("users")
      .where("rollNumber", "==", trimmedRollNumber)
      .get();

    // If another user has this roll number, reject.
    const isDuplicate = duplicateCheck.docs.some(doc => doc.id !== user.id);
    if (isDuplicate) {
      return { status: "error", message: "This Roll Number is already registered to another user." };
    }

    await adminDb.collection("users").doc(user.id).update({
      name: name.trim(),
      rollNumber: trimmedRollNumber,
      department,
      yearOfStudy,
      onboardingCompleted: true,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/");

    return { status: "success" };
  } catch (error: any) {
    console.error("completeOnboardingAction error:", error);
    return { status: "error", message: error.message || "Failed to complete onboarding." };
  }
}
