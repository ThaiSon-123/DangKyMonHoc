import type { SVGProps } from "react";

const ICONS = {
  home: "M3 10.5L10 4l7 6.5V17a1 1 0 01-1 1h-3v-5H7v5H4a1 1 0 01-1-1v-6.5z",
  book: "M4 4.5A1.5 1.5 0 015.5 3H16v13H5.5a1.5 1.5 0 00-1.5 1.5V4.5zM16 16v2H5.5",
  users:
    "M14 13.5A4.5 4.5 0 109.5 9 4.5 4.5 0 0014 13.5zM2 18a6 6 0 0112 0M14 11a4 4 0 014 4",
  calendar:
    "M4 5.5h12a1 1 0 011 1V16a1 1 0 01-1 1H4a1 1 0 01-1-1V6.5a1 1 0 011-1zM3 9h14M7 3v4M13 3v4",
  clipboard:
    "M7 4.5h6m-7 1.5h8a1 1 0 011 1V17a1 1 0 01-1 1H6a1 1 0 01-1-1V7a1 1 0 011-1z M8 3.5h4v2H8z",
  layers: "M10 3l7 4-7 4-7-4 7-4zM3 11l7 4 7-4M3 14.5l7 4 7-4",
  bell: "M5 14V9a5 5 0 0110 0v5l1.5 1.5H3.5L5 14zM8 17.5a2 2 0 004 0",
  search: "M9 3a6 6 0 014.5 10l3.5 3.5M9 15A6 6 0 119 3",
  settings:
    "M10 2v2M10 16v2M3.5 6L5 7M15 13l1.5 1M2 10h2M16 10h2M3.5 14L5 13M15 7l1.5-1M13 10a3 3 0 11-6 0 3 3 0 016 0z",
  chevronRight: "M8 5l5 5-5 5",
  chevronDown: "M5 8l5 5 5-5",
  chevronLeft: "M12 5l-5 5 5 5",
  plus: "M10 4v12M4 10h12",
  filter: "M3 5h14M6 10h8M8 15h4",
  download: "M10 3v10M5 9l5 5 5-5M3 17h14",
  upload: "M10 17V7M5 11l5-5 5 5M3 3h14",
  edit: "M14 3l3 3-9 9H5v-3l9-9z",
  trash: "M4 6h12M8 6V4h4v2M5 6l1 11h8l1-11",
  check: "M4 10l4 4 8-9",
  x: "M5 5l10 10M15 5L5 15",
  graduation: "M2 8l8-4 8 4-8 4-8-4zM5 10v4a5 5 0 0010 0v-4",
  chart: "M3 17V3M3 17h14M7 13V9M11 13V6M15 13v-3",
  megaphone: "M3 8v4l11 5V3L3 8zM3 8h2v4H3z",
  user: "M10 10a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM3 18a7 7 0 0114 0",
  lock: "M5 9h10v8H5V9zM7 9V6a3 3 0 016 0v3",
  shield: "M10 3l6 2v5c0 4-2.5 6-6 7-3.5-1-6-3-6-7V5l6-2z",
  sparkle:
    "M10 3v4M10 13v4M3 10h4M13 10h4M5 5l3 3M15 15l-3-3M5 15l3-3M15 5l-3 3",
  building:
    "M3 17h14M5 17V5h10v12M8 8h1M11 8h1M8 11h1M11 11h1M8 14h4",
  clock: "M10 5v5l3 2M10 17a7 7 0 100-14 7 7 0 000 14z",
  arrowRight: "M4 10h12M11 5l5 5-5 5",
  menu: "M3 6h14M3 10h14M3 14h14",
  doc: "M5 3h7l4 4v10H5V3zM12 3v4h4",
};

export type IconName = keyof typeof ICONS;

interface Props extends Omit<SVGProps<SVGSVGElement>, "name" | "stroke"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export default function Icon({ name, size = 18, strokeWidth = 1.7, className, ...rest }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flex: "0 0 auto" }}
      {...rest}
    >
      <path d={ICONS[name] ?? ICONS.doc} />
    </svg>
  );
}
