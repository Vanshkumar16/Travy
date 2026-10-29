import React from "react";
import { CategoryCode, RADIX_SKILL_CATEGORIES } from "../types/contract";
import { cn } from "../lib/utils";

interface CategoryBadgeProps {
  code: CategoryCode;
  showName?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  code,
  showName = false,
  size = "md",
  className,
}) => {
  const meta = RADIX_SKILL_CATEGORIES[code] || RADIX_SKILL_CATEGORIES.OTHER;

  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 rounded font-mono",
    md: "text-xs px-2.5 py-1 rounded-md font-mono",
    lg: "text-sm px-3 py-1.5 rounded-lg font-mono",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold tracking-wide border shadow-xs transition-colors",
        meta.badgeBg,
        meta.borderColor,
        sizeClasses[size],
        className
      )}
      title={`${code}: ${meta.name} — ${meta.shortDesc}`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: meta.accentHex }}
      />
      <span>{code}</span>
      {showName && (
        <span className="font-sans font-normal opacity-80 border-l border-current/20 pl-1.5">
          {meta.name}
        </span>
      )}
    </span>
  );
};
