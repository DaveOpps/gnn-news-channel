import { redirect } from "next/navigation";
import AccountForm from "@/components/admin/AccountForm";
import { getCurrentEditor } from "@/lib/auth";
import { toPublicEditor } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const me = await getCurrentEditor();
  if (!me) redirect("/admin/login");

  // Every editor manages their own account — this screen is not admin-gated.
  return <AccountForm me={toPublicEditor(me)} />;
}
