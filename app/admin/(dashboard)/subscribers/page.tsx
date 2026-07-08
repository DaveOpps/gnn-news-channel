import SubscribersManager from "@/components/admin/SubscribersManager";
import { getSubscribers } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function AdminSubscribersPage() {
  return <SubscribersManager initial={getSubscribers()} />;
}
