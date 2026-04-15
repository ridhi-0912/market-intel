"use client";

import type { CompetitorActivity, FlaggedClaim } from "../lib/types";
import HallucinationBadge from "./HallucinationBadge";

interface Props {
  activity: CompetitorActivity;
  flaggedClaims: FlaggedClaim[];
}

const TYPE_BADGES: Record<string, string> = {
  product_launch: "bg-blue-100 text-blue-700",
  partnership: "bg-teal-100 text-teal-700",
  hiring: "bg-yellow-100 text-yellow-700",
  funding: "bg-green-100 text-green-700",
  other: "bg-gray-100 text-gray-700",
};

export default function CompetitorCard({ activity, flaggedClaims }: Props) {
  const verdict = flaggedClaims.find((f) => f.claim === activity.description)?.verdict ?? "supported";

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-gray-900">{activity.competitor}</span>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGES[activity.activityType] ?? TYPE_BADGES.other}`}>
          {activity.activityType.replace("_", " ")}
        </span>
        {activity.dateMentioned && (
          <span className="text-xs text-gray-500">{activity.dateMentioned}</span>
        )}
        <div className="ml-auto">
          <HallucinationBadge verdict={verdict} />
        </div>
      </div>
      <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
      <div className="flex flex-wrap gap-1">
        {activity.sourceRefs.map((url, i) => (
          <a
            key={i}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            {new URL(url).hostname}
          </a>
        ))}
      </div>
    </div>
  );
}
