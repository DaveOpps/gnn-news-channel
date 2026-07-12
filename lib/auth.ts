import { cookies } from "next/headers";
import crypto from "crypto";
import { Editor } from "./types";
import { getEditorById, getEditorByUsername } from "./store";
import { verifyPassword } from "./password";

const SECRET = process.env.AUTH_SECRET || "gnn-newsroom-secret-key";

export const SESSION_COOKIE = "gnn_admin_session";

/**
 * The session cookie is "<editorId>.<hmac(editorId)>". It identifies *which*
 * editor is signed in (so we can render their byline and photo), and the
 * signature stops anyone forging another editor's id.
 */
function sign(editorId: string): string {
  return crypto.createHmac("sha256", SECRET).update(editorId).digest("hex");
}

export function sessionValue(editorId: string): string {
  return `${editorId}.${sign(editorId)}`;
}

function editorIdFromSession(value: string | undefined): string | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const id = value.slice(0, dot);
  const signature = value.slice(dot + 1);
  const expected = sign(id);
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  return id;
}

/**
 * A shareable preview token for an unpublished story. Signed with the same
 * secret, so a link cannot be guessed, but it needs no login — which is the
 * point: you send it to someone outside the newsroom.
 */
export function previewToken(articleId: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`preview:${articleId}`)
    .digest("hex")
    .slice(0, 32);
}

export function verifyPreviewToken(articleId: string, token: string | undefined): boolean {
  if (!token) return false;
  const expected = previewToken(articleId);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/** Returns the editor when the credentials are valid, otherwise null. */
export async function verifyCredentials(username: string, password: string): Promise<Editor | null> {
  const editor = await getEditorByUsername(username);
  if (!editor) return null;
  if (!verifyPassword(password, editor.passwordHash)) return null;
  return editor;
}

/** The signed-in editor, or null. */
export async function getCurrentEditor(): Promise<Editor | null> {
  const store = await cookies();
  const id = editorIdFromSession(store.get(SESSION_COOKIE)?.value);
  if (!id) return null;
  return (await getEditorById(id)) ?? null;
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentEditor()) !== null;
}

/** Admins manage editor accounts and may edit every article. */
export async function isAdmin(): Promise<boolean> {
  return (await getCurrentEditor())?.role === "admin";
}

/** An editor may change an article if they own it; admins may change any. */
export function canEditArticle(
  editor: Editor | null,
  article: { authorId?: string; author: string }
): boolean {
  if (!editor) return false;
  if (editor.role === "admin") return true;
  if (article.authorId) return article.authorId === editor.id;
  return article.author.trim().toLowerCase() === editor.name.trim().toLowerCase();
}
