import { redirect } from "next/navigation";
import SectionsManager from "@/components/admin/SectionsManager";
import { getCurrentEditor } from "@/lib/auth";
import { getSections, countArticlesBySection } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function AdminSectionsPage() {
  const me = await getCurrentEditor();
  if (!me) redirect("/admin/login");
  // Sections shape the public navigation — admins only.
  if (me.role !== "admin") redirect("/admin");

  return <SectionsManager initial={getSections()} counts={countArticlesBySection()} />;
}
