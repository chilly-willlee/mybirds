"use client";

import { useState, useEffect } from "react";
import { useLocation } from "@/contexts/location-context";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import type { ScoredObservation } from "@/lib/scoring/types";

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr.includes(" ") ? dateStr.replace(" ", "T") : dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function BirdPhotos({ subIds, speciesCode }: { subIds: string[]; speciesCode: string }) {
  const [photos, setPhotos] = useState<{ url: string; checklistUrl: string }[]>([]);
  const subIdsKey = subIds.slice(0, 5).join(",");

  useEffect(() => {
    if (!subIdsKey) return;
    fetch(`/api/birds/photos?subIds=${subIdsKey}&speciesCode=${speciesCode}`)
      .then((r) => r.ok ? r.json() : { photos: [] })
      .then((data) => setPhotos(data.photos ?? []));
  }, [subIdsKey, speciesCode]);

  if (photos.length === 0) return null;

  return (
    <div className="flex gap-2">
      {photos.map((photo, i) => (
        <a key={i} href={photo.checklistUrl} target="_blank" rel="noopener noreferrer">
          <img
            src={photo.url}
            alt=""
            className="w-20 h-20 object-cover rounded-lg border border-gray-100"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </a>
      ))}
    </div>
  );
}

interface SpeciesDetail {
  sightingCount: number;
  checklists: { subId: string; locName: string; obsDt: string; distanceMiles: number; photoCount: number }[];
}

interface BirdCardProps {
  bird: ScoredObservation;
  showUserStats?: boolean;
  back?: number;
}

export function BirdCard({ bird, showUserStats = false, back = 7 }: BirdCardProps) {
  const { lat, lng, radiusMiles } = useLocation();
  const [showDetail, setShowDetail] = useState(false);
  const [detail, setDetail] = useState<SpeciesDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const distanceMi = Math.round(bird.distanceMiles);

  const primarySubId = bird.subId ?? bird.allSubIds[0];
  const fillSubIds = bird.allSubIds.filter((id) => id !== primarySubId);
  const photoSubIds = primarySubId ? [primarySubId, ...fillSubIds] : fillSubIds;

  function handleShowDetails() {
    if (showDetail) {
      setShowDetail(false);
      return;
    }
    setShowDetail(true);
    if (!detail && lat !== null && lng !== null) {
      setDetailLoading(true);
      fetch(
        `/api/birds/species/${bird.speciesCode}?lat=${lat}&lng=${lng}&radiusMiles=${radiusMiles}&back=${back}&subIds=${bird.allSubIds.join(",")}`,
      )
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) setDetail(data); })
        .finally(() => setDetailLoading(false));
    }
  }

  return (
    <Card>
      <div className="space-y-1.5">
        {/* Line 1: Common name (Scientific name) */}
        <p className="text-base font-semibold leading-snug">
          <a
            href={`https://ebird.org/species/${bird.speciesCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-forest hover:text-forest-light hover:underline hover:underline-offset-2 transition-colors"
          >
            {bird.comName}
          </a>
          {" "}
          <span className="font-normal text-sm italic text-slate">({bird.sciName})</span>
        </p>

        {/* Line 2: Reason tags */}
        {bird.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {bird.reasons.map((reason, i) => (
              <Tag key={i} reason={reason} />
            ))}
          </div>
        )}

        {/* Line 3: Photos */}
        <BirdPhotos subIds={photoSubIds} speciesCode={bird.speciesCode} />

        {/* Line 4: Stats */}
        <p className="flex text-sm text-slate min-w-0">
          <span className="flex-shrink-0 whitespace-nowrap">Last seen: {formatRelativeDate(bird.obsDt)} · {distanceMi} mi away · </span>
          <span className="truncate">{bird.locName}</span>
        </p>

        {/* Line 5: Your sightings (logged-in only) */}
        {showUserStats && (
          <p className="text-sm text-slate">
            {bird.userObservationCount === 0
              ? "You've seen: never"
              : bird.userObservationCount === 1
              ? "You've seen: 1 time"
              : `You've seen: ${bird.userObservationCount} times`}
          </p>
        )}

        {/* Checklist link */}
        {(bird.subId ?? bird.allSubIds[0]) && (
          <a
            href={`https://ebird.org/checklist/${bird.subId ?? bird.allSubIds[0]}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-forest hover:text-forest-light hover:underline hover:underline-offset-2 font-medium transition-colors"
          >
            View checklist
          </a>
        )}

        {/* Show recent sightings toggle */}
        <button
          onClick={handleShowDetails}
          className="block text-sm text-forest hover:text-forest-light font-medium transition-colors"
        >
          {showDetail ? "Hide" : "Show recent sightings"}
        </button>

        {/* Inline detail section */}
        {showDetail && (
          <div className="pt-1 border-t border-gray-100 space-y-2">
            {detailLoading ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ) : detail ? (
              <>
                <p className="text-sm text-slate">
                  {detail.sightingCount === 1
                    ? "1 sighting nearby"
                    : `${detail.sightingCount} sightings nearby`}
                  {" "}in the last {back} {back === 1 ? "day" : "days"}
                </p>

                {detail.checklists.length > 0 && (
                  <div className="space-y-1">
                    {detail.checklists.map((cl) => (
                      <p key={cl.subId} className="text-sm text-slate flex items-center min-w-0 gap-1.5">
                        <span className="flex-shrink-0 whitespace-nowrap">{formatRelativeDate(cl.obsDt)} · {cl.distanceMiles} mi · </span>
                        <a
                          href={`https://ebird.org/checklist/${cl.subId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-forest hover:text-forest-light hover:underline hover:underline-offset-2 font-medium transition-colors"
                        >
                          {cl.locName}
                        </a>
                        {cl.photoCount > 0 && (
                          <>
                            {" · "}
                            <a
                              href={`https://ebird.org/checklist/${cl.subId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-0.5 text-slate hover:text-forest transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="13"
                                height="13"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                              >
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                              </svg>
                              <span>({cl.photoCount})</span>
                            </a>
                          </>
                        )}
                      </p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-slate">Unable to load sightings.</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
