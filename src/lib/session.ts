export { useSession } from "./use-session";

/** @deprecated Use useSession().isAuthenticated instead. */
export function isAuthenticated(): boolean {
  return false;
}
