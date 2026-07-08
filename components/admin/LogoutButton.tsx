"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      className="w-full text-left px-3 py-2.5 rounded hover:bg-white/10 transition-colors text-sm font-semibold text-white/70"
    >
      🚪 Sign out
    </button>
  );
}
