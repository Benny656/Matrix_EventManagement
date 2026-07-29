"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

export async function completeOnboardingAction(data: { name: string; department: string; yearOfStudy: string }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { status: "error", message: "Unauthorized. Please log in again." };
    }

    const { name, department, yearOfStudy } = data;

    if (!name || !name.trim()) return { status: "error", message: "Name is required." };
    if (!department || !["AI", "AIML"].includes(department)) return { status: "error", message: "Invalid department." };
    if (!yearOfStudy || !["1st Year", "2nd Year", "3rd Year", "4th Year"].includes(yearOfStudy)) return { status: "error", message: "Invalid year of study." };

    await adminDb.collection("users").doc(user.id).update({
      name: name.trim(),
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
