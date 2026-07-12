import { notFound } from "next/navigation";
import VideoForm from "@/components/admin/VideoForm";
import { getVideoById } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function EditVideoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const video = getVideoById(id);
  if (!video) notFound();
  return <VideoForm video={video} />;
}
