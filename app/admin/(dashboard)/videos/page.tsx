import VideosManager from "@/components/admin/VideosManager";
import { getVideos } from "@/lib/store";

export const dynamic = "force-dynamic";

export default function AdminVideosPage() {
  return <VideosManager initial={getVideos()} />;
}
