import { redirect } from "next/navigation";
import { getCurrentEditor } from "@/lib/auth";
import { countPendingComments, getTrashed } from "@/lib/store";
import AdminShell from "@/components/admin/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getCurrentEditor();
  if (!me) {
    redirect("/admin/login");
  }

  return (
    <AdminShell
      me={me}
      pendingComments={await countPendingComments()}
      trashedCount={(await getTrashed()).length}
    >
      {children}
    </AdminShell>
  );
}
