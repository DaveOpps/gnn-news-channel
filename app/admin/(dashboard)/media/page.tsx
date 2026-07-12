import { redirect } from "next/navigation";
import MediaManager from "@/components/admin/MediaManager";
import { getCurrentEditor } from "@/lib/auth";
import { getMediaWithUsage } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const me = await getCurrentEditor();
  if (!me) redirect("/admin/login");

  return <MediaManager initial={await getMediaWithUsage()} canDelete={me.role === "admin"} />;
}
