export type OAuthProvider = "google" | "github";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  provider: OAuthProvider;
  image?: string;
}

export interface AuthSession {
  user: AuthUser;
}
