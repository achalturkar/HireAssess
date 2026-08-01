// src/auth/auth-storage.ts

import { LoginSession, User } from "./types";

export const SESSION_KEY = "hireassess_session";

class AuthStorage {

  save(session: LoginSession): void {
    if (typeof window === "undefined") return;

    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify(session)
    );
  }

  get(): LoginSession | null {

    if (typeof window === "undefined") {
      return null;
    }

    const raw = localStorage.getItem(SESSION_KEY);

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as LoginSession;
    } catch {
      this.clear();
      return null;
    }
  }

  clear(): void {

    if (typeof window === "undefined") return;

    localStorage.removeItem(SESSION_KEY);
  }

  updateUser(user: User): void {

    const session = this.get();

    if (!session) return;

    session.user = user;

    this.save(session);
  }

  updateAccessToken(accessToken: string): void {

    const session = this.get();

    if (!session) return;

    session.accessToken = accessToken;

    this.save(session);
  }

  updateRefreshToken(refreshToken: string): void {

    const session = this.get();

    if (!session) return;

    session.refreshToken = refreshToken;

    this.save(session);
  }

  isLoggedIn(): boolean {

    return this.get() !== null;

  }

}

export default new AuthStorage();