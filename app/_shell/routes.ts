export const shellRoutes = [
  { id: "mine", label: "Mine", href: "/mine" },
  { id: "points", label: "Points", href: "/points" },
  { id: "stake", label: "Stake", href: "/stake" },
  { id: "explore", label: "Explore", href: "/explore" },
  { id: "about", label: "About", href: "/about" },
] as const;

export function isRouteActive(pathname: string | null, href: string): boolean {
  if (pathname === null) return false;
  const path = pathname.replace(/\/+$/, "") || "/";
  return path === href || (href !== "/" && path.startsWith(`${href}/`));
}
