"use client";

interface Props {
  verdict: "supported" | "unsupported" | "uncertain" | undefined;
}

const COLORS: Record<string, string> = {
  supported: "bg-green-100 text-green-800",
  uncertain: "bg-amber-100 text-amber-800",
  unsupported: "bg-red-100 text-red-800",
};

export default function HallucinationBadge({ verdict }: Props) {
  if (!verdict) return null;
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${COLORS[verdict] ?? "bg-gray-100 text-gray-600"}`}
    >
      {verdict}
    </span>
  );
}
