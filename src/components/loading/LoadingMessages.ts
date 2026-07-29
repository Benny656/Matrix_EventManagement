export const loadingMessages: Record<string, string> = {
  overview: "Loading Analytics Engine...",
  events: "Building Event Registry...",
  attendance: "Initializing Attendance Terminal...",
  users: "Synchronizing User Directory...",
  updates: "Fetching System Notices...",
  reports: "Compiling Reports...",
  certificates: "Preparing Certificate Engine...",
  default: "Initializing Matrix OS...",
};

export const getLoadingMessage = (pathname: string): string => {
  const path = pathname.toLowerCase();
  
  if (path.includes("/events")) return loadingMessages.events;
  if (path.includes("/attendance")) return loadingMessages.attendance;
  if (path.includes("/users")) return loadingMessages.users;
  if (path.includes("/updates")) return loadingMessages.updates;
  if (path.includes("/reports")) return loadingMessages.reports;
  if (path.includes("/certificates")) return loadingMessages.certificates;
  
  // Base dashboard routes
  if (path === "/admin" || path === "/volunteer" || path === "/student") {
    return loadingMessages.overview;
  }
  
  return loadingMessages.default;
};
