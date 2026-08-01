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
  /** Legacy single degree target when targetAudience === "STUDENTS" */
  degree?: DegreeTarget;
  /** Multi-select degree/program targets when targetAudience === "STUDENTS" */
  degrees?: (DegreeTarget | string)[];
  /** Multi-select year targets when targetAudience === "STUDENTS" */
  years?: YearTarget[];
  /** Multi-select department targets when targetAudience === "STUDENTS" */
  departments?: string[];
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
 *      targetAudience is "STUDENTS" AND degree/program matches AND year matches AND department matches
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
  const { targetAudience, degree, degrees, years, departments } = eligibility;

  // Events open to everyone
  if (targetAudience === "ALL") return true;

  // Faculty check
  if (user.role === "FACULTY") {
    return targetAudience === "FACULTY";
  }

  // Student check
  if (user.role === "STUDENT") {
    if (targetAudience !== "STUDENTS") return false;

    // Degree / Program level match
    let degreeOk = true;
    if (degrees && degrees.length > 0) {
      degreeOk =
        degrees.includes("ALL") ||
        (Boolean(user.programType) && degrees.includes(user.programType as string)) ||
        (Boolean(user.degree) && degrees.includes(user.degree as string));
    } else if (degree) {
      degreeOk =
        degree === "ALL" ||
        degree === (user.programType as string) ||
        degree === (user.degree as string);
    }

    if (!degreeOk) return false;

    // Year match
    const yearsOk =
      !years ||
      years.length === 0 ||
      years.includes("ALL") ||
      (Boolean(user.yearOfStudy) && years.includes(user.yearOfStudy as YearTarget));

    if (!yearsOk) return false;

    // Department match
    const departmentsOk =
      !departments ||
      departments.length === 0 ||
      departments.includes("ALL") ||
      (Boolean(user.department) && departments.includes(user.department as string));

    return departmentsOk;
  }

  return false;
}
