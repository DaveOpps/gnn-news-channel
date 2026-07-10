import { editorInitials } from "@/lib/types";

/**
 * An editor's photo, falling back to their initials on a brand-tinted disc
 * when no photo has been uploaded yet.
 */
export default function EditorAvatar({
  name,
  photoUrl,
  size = 40,
  className = "",
}: {
  name: string;
  photoUrl?: string;
  size?: number;
  className?: string;
}) {
  const dimension = { width: size, height: size };

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        style={dimension}
        className={`rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm ${className}`}
      />
    );
  }

  return (
    <span
      style={{ ...dimension, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      className={`rounded-full shrink-0 flex items-center justify-center font-black text-white bg-gradient-to-br from-brand to-brand-dark ring-2 ring-white shadow-sm ${className}`}
      aria-hidden="true"
    >
      {editorInitials(name)}
    </span>
  );
}
