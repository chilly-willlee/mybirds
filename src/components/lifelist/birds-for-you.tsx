"use client";

import { useState, useEffect } from "react";
import { useLocation } from "@/contexts/location-context";
import { BirdCard } from "@/components/birds/bird-card";
import type { ScoredObservation } from "@/lib/scoring/types";

type SortOption = "score" | "distance" | "date" | "alpha";

const PAGE_SIZE = 20;

export function BirdsForYou() {
  const { lat, lng, radiusMiles } = useLocation();
  const [birds, setBirds] = useState<ScoredObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("score");
  const [back, setBack] = useState(7);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (lat === null || lng === null) return;

    setLoading(true);
    setVisibleCount(PAGE_SIZE);
    fetch(`/api/birds/scored?lat=${lat}&lng=${lng}&radiusMiles=${radiusMiles}&back=${back}`)
      .then((r) => r.json())
      .then((data) => setBirds(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [lat, lng, radiusMiles, back]);

  const sorted = [...birds].sort((a, b) => {
    switch (sort) {
      case "distance": return a.distanceMiles - b.distanceMiles;
      case "date": return b.obsDt.localeCompare(a.obsDt);
      case "alpha": return a.comName.localeCompare(b.comName);
      default: return b.score - a.score;
    }
  });

  const visible = sorted.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-slate">{radiusMiles} mi radius</span>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value as SortOption); setVisibleCount(PAGE_SIZE); }}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white cursor-pointer"
        >
          <option value="score">Best match</option>
          <option value="distance">Nearest</option>
          <option value="date">Most recent</option>
          <option value="alpha">A → Z</option>
        </select>
        <select
          value={back}
          onChange={(e) => setBack(Number(e.target.value))}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white cursor-pointer"
        >
          <option value={1}>Last 1 day</option>
          <option value={3}>Last 3 days</option>
          <option value={7}>Last 7 days</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface rounded-lg border border-gray-100 p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-center text-slate py-8">
          No recommended birds nearby in the last {back} days. Try expanding your search radius!
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((bird) => (
            <BirdCard key={bird.speciesCode} bird={bird} showUserStats back={back} />
          ))}
          {visibleCount < sorted.length && (
            <button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="w-full py-2 text-sm text-forest hover:text-forest-light font-medium transition-colors"
            >
              Show more ({sorted.length - visibleCount} remaining)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
