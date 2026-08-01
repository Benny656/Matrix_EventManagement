export const loadingMessages: Record<string, string> = {
  welcome: "WELCOME TO MATRIX OS",
  overview: "Loading Dashboard Analytics...",
  events: "Building Event Registry...",
  registrations: "Fetching Registrations & RSVP Records...",
  attendance: "Initializing Attendance Terminal...",
  users: "Synchronizing User Directory...",
  updates: "Fetching System Notices...",
  reports: "Compiling Analytics & Reports...",
  certificates: "Preparing Certificate Engine...",
  profile: "Loading User Profile & Credentials...",
  onboarding: "Initializing User Onboarding...",
  default: "Loading Section Resources...",
};

export interface SectionLoadingMeta {
  message: string;
  headerTag: string;
  command: string;
  subStatus: string;
}

export const getLoadingMessage = (pathname: string): string => {
  return getSectionLoadingMeta(pathname).message;
};

export const getSectionLoadingMeta = (pathname: string): SectionLoadingMeta => {
  const path = pathname.toLowerCase();

  // Landing Page ONLY gets the Welcome message
  if (path === "/" || path === "" || path === "/home") {
    return {
      message: loadingMessages.welcome,
      headerTag: "MATRIX_OS // EXEC_STREAM",
      command: "matrix --init --system=root",
      subStatus: "STATUS: INITIALIZING SYSTEM...",
    };
  }

  if (path.includes("/events")) {
    return {
      message: loadingMessages.events,
      headerTag: "MATRIX_OS // EVENTS_MODULE",
      command: "matrix --fetch --module=events",
      subStatus: "STATUS: SYNCING EVENTS...",
    };
  }

  if (path.includes("/registrations")) {
    return {
      message: loadingMessages.registrations,
      headerTag: "MATRIX_OS // REGISTRATIONS_MODULE",
      command: "matrix --fetch --module=registrations",
      subStatus: "STATUS: VERIFYING RSVPS...",
    };
  }

  if (path.includes("/attendance")) {
    return {
      message: loadingMessages.attendance,
      headerTag: "MATRIX_OS // ATTENDANCE_TERMINAL",
      command: "matrix --fetch --module=attendance",
      subStatus: "STATUS: SCANNER READY...",
    };
  }

  if (path.includes("/users")) {
    return {
      message: loadingMessages.users,
      headerTag: "MATRIX_OS // DIRECTORY_MODULE",
      command: "matrix --fetch --module=users",
      subStatus: "STATUS: QUERYING DIRECTORY...",
    };
  }

  if (path.includes("/reports")) {
    return {
      message: loadingMessages.reports,
      headerTag: "MATRIX_OS // REPORTS_ENGINE",
      command: "matrix --fetch --module=reports",
      subStatus: "STATUS: COMPILING REPORTS...",
    };
  }

  if (path.includes("/profile")) {
    return {
      message: loadingMessages.profile,
      headerTag: "MATRIX_OS // PROFILE_MODULE",
      command: "matrix --fetch --module=profile",
      subStatus: "STATUS: LOADING PROFILE...",
    };
  }

  if (path.includes("/onboarding")) {
    return {
      message: loadingMessages.onboarding,
      headerTag: "MATRIX_OS // ONBOARDING_FLOW",
      command: "matrix --fetch --module=onboarding",
      subStatus: "STATUS: SETTING UP...",
    };
  }

  // Base Dashboard routes (/admin, /student, /faculty, /volunteer)
  if (
    path.startsWith("/admin") ||
    path.startsWith("/student") ||
    path.startsWith("/faculty") ||
    path.startsWith("/volunteer")
  ) {
    return {
      message: loadingMessages.overview,
      headerTag: "MATRIX_OS // DASHBOARD_OVERVIEW",
      command: `matrix --fetch --route=${path}`,
      subStatus: "STATUS: STREAMING ANALYTICS...",
    };
  }

  return {
    message: loadingMessages.default,
    headerTag: "MATRIX_OS // SECTION_LOADER",
    command: `matrix --fetch --route=${path}`,
    subStatus: "STATUS: LOADING SECTION...",
  };
};
