"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getCurrentUser } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

export async function completeOnboardingAction(data: {
  name: string;
  rollNumber?: string;
  programType?: string;
  degree?: string;
  department: string;
  yearOfStudy?: string;
  phoneNumber: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { status: "error", message: "Unauthorized. Please log in again." };
    }

    const isFaculty = user.role === "FACULTY" || user.role === "FACULTY_ADMIN";
    const { name, rollNumber, programType, degree, department, yearOfStudy, phoneNumber } = data;

    if (!name || !name.trim()) return { status: "error", message: "Name is required." };

    if (!department || !["AI", "AIML"].includes(department)) return { status: "error", message: "Please select a valid department." };

    const cleanedPhone = (phoneNumber || "").replace(/\D/g, "");
    if (!cleanedPhone) return { status: "error", message: "Phone Number is required." };
    if (!/^[6-9]\d{9}$/.test(cleanedPhone)) {
      return { status: "error", message: "Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9." };
    }

    let trimmedRollNumber: string | null = null;
    let validProgramType: string | null = null;
    let validDegree: string | null = null;
    let validYearOfStudy: string | null = null;

    if (!isFaculty) {
      trimmedRollNumber = rollNumber?.trim().toUpperCase() || null;
      if (!trimmedRollNumber) return { status: "error", message: "Roll Number is required." };

      if (!programType || !["UG", "PG"].includes(programType)) {
        return { status: "error", message: "Please select your Program Level (UG or PG)." };
      }
      validProgramType = programType;

      if (!degree || !degree.trim()) {
        return { status: "error", message: "Please select your degree." };
      }
      validDegree = degree.trim();

      if (!yearOfStudy || !["1st Year", "2nd Year", "3rd Year", "4th Year"].includes(yearOfStudy)) {
        return { status: "error", message: "Invalid year of study." };
      }
      validYearOfStudy = yearOfStudy;

      // Check for duplicate roll number
      const duplicateCheck = await adminDb.collection("users")
        .where("rollNumber", "==", trimmedRollNumber)
        .get();

      // If another user has this roll number, reject.
      const isDuplicate = duplicateCheck.docs.some(doc => doc.id !== user.id);
      if (isDuplicate) {
        return { status: "error", message: "This Roll Number is already registered to another user." };
      }
    }

    await adminDb.collection("users").doc(user.id).update({
      name: name.trim(),
      rollNumber: trimmedRollNumber,
      programType: validProgramType,
      degree: validDegree,
      department,
      yearOfStudy: validYearOfStudy,
      phoneNumber: cleanedPhone,
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
