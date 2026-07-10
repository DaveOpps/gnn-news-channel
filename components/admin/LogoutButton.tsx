"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./ui";

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
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition-colors hover:bg-zinc-800/40 hover:text-zinc-100"
    >
      <Icon.Logout className="h-[18px] w-[18px] text-zinc-500" />
      Sign out
    </button>
  );
}
