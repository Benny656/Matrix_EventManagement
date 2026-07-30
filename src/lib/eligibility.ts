import type { UserProfile } from "./auth-session";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TargetAudience = "ALL" | "STUDENTS" | "FACULTY";
export type DegreeTarget = "UG" | "PG" | "ALL";
export type YearTarget =
  | "1st Year"
  | "2nd Year"
  | "3rd Year"
  | "4th Year"
  | "ALL";

export interface EventEligibility {
  targetAudience: TargetAudience;
  /** Only relevant when targetAudience === "STUDENTS" */
  degree?: DegreeTarget;
  /** Only relevant when targetAudience === "STUDENTS" */
  years?: YearTarget[];
}

/** Shape of the event doc fields needed for eligibility checks */
export interface EligibleEvent {
  eligibility?: EventEligibility | null;
}

// ─── Core logic ───────────────────────────────────────────────────────────────

/**
 * Returns true when `user` is allowed to see / register for `event`.
 *
 * Rules:
 *  - ADMIN, FACULTY_ADMIN, VOLUNTEER → always eligible
 *  - FACULTY → eligible when targetAudience is "ALL" or "FACULTY"
 *  - STUDENT → eligible when:
 *      targetAudience is "ALL"   OR
 *      targetAudience is "STUDENTS" AND degree matches AND year matches
 *  - Events without an eligibility field → treated as targetAudience "ALL"
 */
export function isEligible(event: EligibleEvent, user: UserProfile): boolean {
  // Privileged roles always have access
  if (
    user.role === "ADMIN" ||
    user.role === "FACULTY_ADMIN" ||
    user.role === "VOLUNTEER"
  ) {
    return true;
  }

  const eligibility = event.eligibility ?? { targetAudience: "ALL" };
  const { targetAudience, degree, years } = eligibility;

  // Events open to everyone
  if (targetAudience === "ALL") return true;

  // Faculty check
  if (user.role === "FACULTY") {
    return targetAudience === "FACULTY";
  }

  // Student check
  if (user.role === "STUDENT") {
    if (targetAudience !== "STUDENTS") return false;

    // Degree match
    const degreeOk =
      !degree ||
      degree === "ALL" ||
      degree === (user.programType as string); // programType stores "UG" | "PG"

    if (!degreeOk) return false;

    // Year match
    const yearsOk =
      !years ||
      years.length === 0 ||
      years.includes("ALL") ||
      years.includes(user.yearOfStudy as YearTarget);

    return yearsOk;
  }

  return false;
}
