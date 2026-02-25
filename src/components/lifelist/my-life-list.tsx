"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import type { LifeListEntry } from "@/lib/lifelist/types";

type SortOption = "date-desc" | "date-asc" | "alpha-asc" | "alpha-desc";

export function MyLifeList() {
  const [species, setSpecies] = useState<LifeListEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("date-desc");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ sort });
    if (search) params.set("search", search);

    fetch(`/api/lifelist?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSpecies(data.species ?? []);
        setTotalCount(data.totalCount ?? 0);
      })
      .finally(() => setLoading(false));
  }, [sort, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <p className="text-lg font-semibold">{totalCount} species</p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search species..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/20"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white cursor-pointer"
          >
            <option value="date-desc">Newest first</option>
            <option value="date-asc">Oldest first</option>
            <option value="alpha-asc">A → Z</option>
            <option value="alpha-desc">Z → A</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-surface rounded-lg border border-gray-100 p-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-1" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : species.length === 0 ? (
        <Card className="text-center py-8">
          <p className="text-slate">
            {search ? "No species match your search." : "No life list imported yet. Go to Settings to upload your eBird CSV."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {species.map((s) => (
            <Card key={s.scientificName} className="py-3">
              <p className="font-medium leading-snug">
                <a
                  href={`https://ebird.org/species/${encodeURIComponent(s.scientificName)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-forest hover:text-forest-light transition-colors"
                >
                  {s.commonName}
                </a>
                {" "}
                <span className="font-normal text-sm italic text-slate">({s.scientificName})</span>
              </p>
              <p className="text-sm text-slate mt-0.5">
                First spotted: {s.firstObservation.date || "—"} · {s.firstObservation.location || "—"}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
