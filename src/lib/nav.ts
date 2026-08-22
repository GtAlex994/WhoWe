// Routes that own their full-screen layout and don't use the shared
// header/dock chrome (sign-in flow, onboarding wizard).
export const NAV_HIDDEN_ROUTES = ["/sign-in", "/onboarding"];

export function isNavHiddenRoute(pathname: string | null) {
  return NAV_HIDDEN_ROUTES.some((path) => pathname === path || pathname?.startsWith(`${path}/`));
}
