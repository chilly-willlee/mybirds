"use client";

import { useState, useEffect } from "react";
import { useLocation } from "@/contexts/location-context";
import { useGeolocation } from "@/hooks/use-geolocation";
import { BirdCard } from "./bird-card";
import { Button } from "@/components/ui/button";
import type { ScoredObservation } from "@/lib/scoring/types";

type SortOption = "score" | "distance" | "date" | "alpha";

const PAGE_SIZE = 20;

export function LandingBirds({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { lat, lng, radiusMiles, setLocation } = useLocation();
  const geo = useGeolocation();
  const [birds, setBirds] = useState<ScoredObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("score");
  const [back, setBack] = useState(7);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (geo.lat !== null && geo.lng !== null && lat === null) {
      setLocation(geo.lat, geo.lng);
    }
  }, [geo.lat, geo.lng, lat, setLocation]);

  useEffect(() => {
    if (lat === null || lng === null) return;

    setLoading(true);
    setError(null);
    setVisibleCount(PAGE_SIZE);

    fetch(`/api/birds/scored?lat=${lat}&lng=${lng}&radiusMiles=${radiusMiles}&back=${back}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch birds");
        return r.json();
      })
      .then((data) => setBirds(data))
      .catch(() => setError("Unable to load birds. Please try again."))
      .finally(() => setLoading(false));
  }, [lat, lng, radiusMiles, back]);

  if (lat === null || lng === null) {
    return (
      <div className="text-center py-12">
        <p className="text-slate mb-4">Allow location access to see birds near you</p>
        <Button onClick={geo.requestLocation} loading={geo.loading}>
          Use My Location
        </Button>
        {geo.error && <p className="text-sm text-red-600 mt-2">{geo.error}</p>}
      </div>
    );
  }

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
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white cursor-pointer"
        >
          <option value="score">Best match</option>
          <option value="distance">Nearest</option>
          <option value="date">Most recent</option>
          <option value="alpha">A → Z</option>
        </select>
        <select
          value={back}
          onChange={(e) => { setBack(Number(e.target.value)); setVisibleCount(PAGE_SIZE); }}
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
      ) : error ? (
        <p className="text-center text-red-600 py-8">{error}</p>
      ) : sorted.length === 0 ? (
        <p className="text-center text-slate py-8">
          No notable birds found nearby in the last {back} days. Try expanding your search radius!
        </p>
      ) : (
        <div className="space-y-3">
          {visible.map((bird) => (
            <BirdCard key={bird.speciesCode} bird={bird} showUserStats={isLoggedIn} back={back} />
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
