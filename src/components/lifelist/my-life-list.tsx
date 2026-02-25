"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { LifeListEntry } from "@/lib/lifelist/types";

type DateMode = "first" | "last";
type SortOption = "newest" | "oldest" | "alpha-asc" | "alpha-desc" | "taxonomic";
type UploadType = "first-seen" | "last-seen";

interface ImportStatus {
  firstSeen: { speciesCount: number; importedAt: string } | null;
  lastSeen: { speciesCount: number; importedAt: string } | null;
}

function getApiSort(sort: SortOption, dateMode: DateMode): string {
  if (sort === "newest") return dateMode === "last" ? "last-date-desc" : "date-desc";
  if (sort === "oldest") return dateMode === "last" ? "last-date-asc" : "date-asc";
  return sort;
}

function formatDate(raw: string | null | undefined): string {
  if (!raw) return "—";
  return new Date(raw).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function ObsLink({ checklistId, date }: { checklistId: string; date: string }) {
  return (
    <a
      href={`https://ebird.org/checklist/${checklistId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-forest hover:text-forest-light hover:underline hover:underline-offset-2 transition-colors"
    >
      {date || "—"}
    </a>
  );
}

function LocationLink({ locationId, location }: { locationId?: string; location: string }) {
  if (!locationId) return <span>{location || "—"}</span>;
  return (
    <a
      href={`https://ebird.org/lifelist?r=${locationId}&time=life`}
      target="_blank"
      rel="noopener noreferrer"
      className="text-forest hover:text-forest-light hover:underline hover:underline-offset-2 transition-colors"
    >
      {location || "—"}
    </a>
  );
}

function LifeListPhotos({ checklistId, speciesCode }: { checklistId: string; speciesCode: string }) {
  const [shown, setShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [photos, setPhotos] = useState<{ url: string; checklistUrl: string }[] | null>(null);

  function handleToggle() {
    if (shown) {
      setShown(false);
      return;
    }
    setShown(true);
    if (photos === null) {
      setLoading(true);
      fetch(`/api/birds/photos?subIds=${checklistId}&speciesCode=${speciesCode}`)
        .then((r) => (r.ok ? r.json() : { photos: [] }))
        .then((data) => setPhotos(data.photos ?? []))
        .finally(() => setLoading(false));
    }
  }

  return (
    <div className="mt-1.5">
      <button
        onClick={handleToggle}
        className="text-xs text-forest hover:text-forest-light font-medium transition-colors"
      >
        {shown ? "Hide photos" : "📷 Show photos"}
      </button>
      {shown && (
        <div className="mt-1.5">
          {loading ? (
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : photos && photos.length > 0 ? (
            <div className="flex gap-2">
              {photos.map((photo, i) => (
                <a key={i} href={photo.checklistUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={photo.url}
                    alt=""
                    className="w-20 h-20 object-cover rounded-lg border border-gray-100"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate">No photos found for this checklist.</p>
          )}
        </div>
      )}
    </div>
  );
}

export function MyLifeList() {
  const [species, setSpecies] = useState<LifeListEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [importStatus, setImportStatus] = useState<ImportStatus>({ firstSeen: null, lastSeen: null });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [dateMode, setDateMode] = useState<DateMode>("first");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingUploadType = useRef<UploadType>("first-seen");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const hasFirstSeen = !!importStatus.firstSeen;
  const hasLastSeen = !!importStatus.lastSeen;

  function fetchList(currentSort: SortOption, currentDateMode: DateMode, currentSearch: string) {
    setLoading(true);
    const apiSort = getApiSort(currentSort, currentDateMode);
    const params = new URLSearchParams({ sort: apiSort });
    if (currentSearch) params.set("search", currentSearch);

    fetch(`/api/lifelist?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setSpecies(data.species ?? []);
        setTotalCount(data.totalCount ?? 0);
        if (data.importStatus) setImportStatus(data.importStatus);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchList(sort, dateMode, search);
  }, [sort, dateMode, search]);

  useEffect(() => {
    if (dateMode === "last" && !hasLastSeen) setDateMode("first");
  }, [hasLastSeen, dateMode]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", pendingUploadType.current);

    try {
      const res = await fetch("/api/lifelist/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        const label = pendingUploadType.current === "first-seen" ? "First seen" : "Last seen";
        setUploadStatus(`${label}: imported ${data.speciesCount} species.`);
        fetchList(sort, dateMode, search);
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch {
      setUploadStatus("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-3">
      {/* Row 1: species count */}
      <p className="text-sm font-semibold text-charcoal">{totalCount} species</p>

      {/* Row 2: upload controls */}
      <div className="flex flex-wrap gap-x-3 gap-y-2 items-center">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleUpload}
          className="hidden"
        />
        <span className="text-sm text-slate">Upload CSV:</span>
        <Button
          onClick={() => { pendingUploadType.current = "first-seen"; fileInputRef.current?.click(); }}
          loading={uploading}
          variant="secondary"
          size="sm"
        >
          First Seen
        </Button>
        <Button
          onClick={() => { pendingUploadType.current = "last-seen"; fileInputRef.current?.click(); }}
          loading={uploading}
          variant="secondary"
          size="sm"
        >
          Last Seen
        </Button>
        <a
          href="https://ebird.org/lifelist?time=life&r=world"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-forest hover:text-forest-light transition-colors whitespace-nowrap"
        >
          Download from eBird ↗
        </a>
      </div>

      {/* Import status lines */}
      <div className="text-xs text-slate space-y-0.5">
        <p>
          First seen:{" "}
          {importStatus.firstSeen
            ? `${importStatus.firstSeen.speciesCount} species · ${formatDate(importStatus.firstSeen.importedAt)}`
            : "not uploaded"}
        </p>
        <p>
          Last seen:{" "}
          {importStatus.lastSeen
            ? `${importStatus.lastSeen.speciesCount} species · ${formatDate(importStatus.lastSeen.importedAt)}`
            : "not uploaded"}
        </p>
      </div>

      {uploadStatus && (
        <p className={`text-sm ${uploadStatus.startsWith("Error") ? "text-red-600" : "text-forest"}`}>
          {uploadStatus}
        </p>
      )}

      {/* Row 3: search + sort + date toggle */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search species..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-32 px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-forest/20"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white cursor-pointer"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="alpha-asc">A → Z</option>
          <option value="alpha-desc">Z → A</option>
          <option value="taxonomic">Taxonomic</option>
        </select>

        {/* Date mode toggle — always shown, Last seen greyed if not uploaded */}
        <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
          <button
            onClick={() => setDateMode("first")}
            disabled={!hasFirstSeen}
            title={!hasFirstSeen ? "Upload First Seen CSV to enable" : undefined}
            className={`px-3 py-1.5 font-medium transition-colors ${
              dateMode === "first"
                ? "bg-forest text-white"
                : !hasFirstSeen
                ? "bg-white text-gray-300 cursor-not-allowed"
                : "bg-white text-slate hover:text-charcoal"
            }`}
          >
            First seen
          </button>
          <button
            onClick={() => hasLastSeen && setDateMode("last")}
            disabled={!hasLastSeen}
            title={!hasLastSeen ? "Upload Last Seen CSV to enable" : undefined}
            className={`px-3 py-1.5 font-medium transition-colors border-l border-gray-200 ${
              dateMode === "last"
                ? "bg-forest text-white"
                : !hasLastSeen
                ? "bg-white text-gray-300 cursor-not-allowed"
                : "bg-white text-slate hover:text-charcoal"
            }`}
          >
            Last seen
          </button>
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
            {search ? "No species match your search." : "No life list imported yet. Upload your eBird CSV above."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {species.map((s) => {
            const firstObs = s.firstObservation;
            const lastObs = s.lastObservation;
            // Fallback: if selected mode has no date, use the other
            const obs =
              dateMode === "last"
                ? lastObs.date ? lastObs : firstObs
                : firstObs.date ? firstObs : lastObs;
            const canShowPhotos = !!(s.speciesCode && lastObs.checklistId);

            return (
              <Card key={s.scientificName} className="py-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">
                    {s.speciesCode ? (
                      <a
                        href={`https://ebird.org/species/${s.speciesCode}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-forest hover:text-forest-light hover:underline hover:underline-offset-2 transition-colors"
                      >
                        {s.commonName}
                      </a>
                    ) : (
                      <span>{s.commonName}</span>
                    )}{" "}
                    <span className="font-normal text-sm italic text-slate">({s.scientificName})</span>
                  </p>

                  {s.speciesCode && s.observationCount > 0 && (
                    <a
                      href={`https://ebird.org/lifelist?r=world&time=life&spp=${s.speciesCode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 text-xs text-slate hover:text-forest hover:underline hover:underline-offset-2 transition-colors whitespace-nowrap"
                    >
                      {s.observationCount === 1 ? "Seen 1 time" : `Seen ${s.observationCount} times`} ↗
                    </a>
                  )}
                </div>

                <p className="text-sm text-slate mt-0.5">
                  {obs.checklistId ? (
                    <ObsLink checklistId={obs.checklistId} date={formatDate(obs.date)} />
                  ) : (
                    formatDate(obs.date)
                  )}
                  {" · "}
                  <LocationLink locationId={obs.locationId} location={obs.location} />
                </p>

                {canShowPhotos && (
                  <LifeListPhotos
                    checklistId={lastObs.checklistId}
                    speciesCode={s.speciesCode!}
                  />
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
