import { ResourceIcon } from "@/lib/types";

const GLYPH: Record<ResourceIcon, string> = {
  currency: "$",
  dictionary: "Ab",
  business: "🏢",
  jobs: "💼",
  classifieds: "📋",
  photos: "📷",
  radio: "📻",
  map: "🗺",
  weather: "☀",
  events: "📅",
};

export default function ResourceIconBadge({
  icon,
  className = "",
}: {
  icon: ResourceIcon;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center justify-center bg-brand text-white font-semibold shrink-0 ${className}`}
      aria-hidden
    >
      {GLYPH[icon]}
    </span>
  );
}
