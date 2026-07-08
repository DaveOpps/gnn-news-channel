import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "gnn2026";
const SECRET = process.env.AUTH_SECRET || "gnn-newsroom-secret-key";

export const SESSION_COOKIE = "gnn_admin_session";

export function sessionToken(): string {
  return crypto.createHmac("sha256", SECRET).update(ADMIN_USER).digest("hex");
}

export function validCredentials(username: string, password: string): boolean {
  return username === ADMIN_USER && password === ADMIN_PASS;
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === sessionToken();
}
