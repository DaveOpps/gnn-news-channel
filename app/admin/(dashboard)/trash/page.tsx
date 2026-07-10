import { redirect } from "next/navigation";
import TrashManager from "@/components/admin/TrashManager";
import { getCurrentEditor } from "@/lib/auth";
import { getTrashed } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminTrashPage() {
  const me = await getCurrentEditor();
  if (!me) redirect("/admin/login");

  return <TrashManager initial={getTrashed()} canPurge={me.role === "admin"} />;
}
