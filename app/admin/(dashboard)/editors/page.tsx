import { redirect } from "next/navigation";
import EditorsManager from "@/components/admin/EditorsManager";
import { getCurrentEditor } from "@/lib/auth";
import { getPublicEditors } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminEditorsPage() {
  const me = await getCurrentEditor();
  if (!me) redirect("/admin/login");
  // Managing accounts is an admin-only screen.
  if (me.role !== "admin") redirect("/admin");

  return <EditorsManager initial={getPublicEditors()} currentEditorId={me.id} />;
}
