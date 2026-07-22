import type { CategoryId } from "../lib/category-theme";

interface CategoryIconProps {
  category: CategoryId;
  className?: string;
}

const commonProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const assetIcons: Partial<Record<CategoryId, { src: string; alt: string }>> = {
  pdf: { src: "/icons/pdf.png", alt: "PDF" },
  image: { src: "/icons/image.png", alt: "Images" },
  office: { src: "/icons/office.png", alt: "Office" },
};

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const asset = assetIcons[category];
  if (asset) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={asset.src}
        alt=""
        aria-hidden="true"
        className={["object-contain", className].filter(Boolean).join(" ")}
      />
    );
  }

  switch (category) {
    case "video":
      return (
        <svg {...commonProps} className={className}>
          <rect x="3" y="6" width="13" height="12" rx="2.5" />
          <path d="M16 10l5-2.5v9L16 14" />
          <path d="M7 9.5l3 2.5-3 2.5v-5Z" />
        </svg>
      );
    case "audio":
      return (
        <svg {...commonProps} className={className}>
          <path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 11v2" />
        </svg>
      );
    default:
      return null;
  }
}
