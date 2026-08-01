export const loadingMessages: Record<string, string> = {
  welcome: "WELCOME",
  overview: "Loading Analytics Engine...",
  events: "Building Event Registry...",
  registrations: "Fetching Registrations...",
  attendance: "Initializing Attendance Terminal...",
  users: "Synchronizing User Directory...",
  updates: "Fetching System Notices...",
  reports: "Compiling Reports...",
  certificates: "Preparing Certificate Engine...",
  profile: "Loading User Profile...",
  onboarding: "Initializing Onboarding...",
  default: "Initializing Matrix OS...",
};

export const getLoadingMessage = (pathname: string): string => {
  const path = pathname.toLowerCase();
  
  if (path === "/" || path === "" || path === "/home") {
    return loadingMessages.welcome;
  }

  if (path.includes("/events")) return loadingMessages.events;
  if (path.includes("/registrations")) return loadingMessages.registrations;
  if (path.includes("/attendance")) return loadingMessages.attendance;
  if (path.includes("/users")) return loadingMessages.users;
  if (path.includes("/updates")) return loadingMessages.updates;
  if (path.includes("/reports")) return loadingMessages.reports;
  if (path.includes("/certificates")) return loadingMessages.certificates;
  if (path.includes("/profile")) return loadingMessages.profile;
  if (path.includes("/onboarding")) return loadingMessages.onboarding;
  
  // Base dashboard routes
  if (path === "/admin" || path === "/volunteer" || path === "/student" || path === "/faculty") {
    return loadingMessages.overview;
  }
  
  return loadingMessages.default;
};
