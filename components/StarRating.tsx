"use client";

import { useState } from "react";

interface StarRatingProps {
  value: number; // 0–5
  onChange?: (value: number) => void; // omit for read-only display
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  disabled?: boolean;
}

const SIZES = { sm: "text-sm", md: "text-xl", lg: "text-3xl" };

export default function StarRating({
  value,
  onChange,
  size = "md",
  showValue = false,
  disabled = false,
}: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const editable = Boolean(onChange) && !disabled;
  const shown = hover || value;

  return (
    <span className="inline-flex items-center gap-1 select-none">
      <span className={`inline-flex ${SIZES[size]} leading-none`}>
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= shown;
          return (
            <span
              key={star}
              role={editable ? "button" : undefined}
              aria-label={editable ? `Rate ${star} star${star > 1 ? "s" : ""}` : undefined}
              onMouseEnter={editable ? () => setHover(star) : undefined}
              onMouseLeave={editable ? () => setHover(0) : undefined}
              onClick={
                editable
                  ? () => onChange!(value === star ? 0 : star) // click same star again clears
                  : undefined
              }
              className={`${filled ? "text-amber-400" : "text-neutral-300"} ${
                editable ? "cursor-pointer hover:scale-110 transition-transform" : ""
              }`}
            >
              ★
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className="text-xs font-bold text-neutral-500">
          {value > 0 ? value.toFixed(0) + "/5" : "Unrated"}
        </span>
      )}
    </span>
  );
}
