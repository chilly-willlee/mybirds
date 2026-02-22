"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLocation } from "@/contexts/location-context";
import { useGeolocation } from "@/hooks/use-geolocation";

export function SettingsContent() {
  const { lat, lng, radiusMiles, setLocation, setRadius } = useLocation();
  const geo = useGeolocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [stats, setStats] = useState<{ speciesCount: number } | null>(null);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.lat) setManualLat(String(data.lat));
        if (data.lng) setManualLng(String(data.lng));
      });
  }, []);

  useEffect(() => {
    fetch("/api/lifelist")
      .then((r) => r.json())
      .then((data) => {
        if (data.totalCount !== undefined) {
          setStats({ speciesCount: data.totalCount });
        }
      });
  }, []);

  useEffect(() => {
    if (geo.lat !== null && geo.lng !== null) {
      setLocation(geo.lat, geo.lng);
      setManualLat(String(geo.lat.toFixed(4)));
      setManualLng(String(geo.lng.toFixed(4)));
    }
  }, [geo.lat, geo.lng, setLocation]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/lifelist/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setUploadStatus(`Imported ${data.speciesCount} species from ${data.totalObservations} observations.`);
        setStats({ speciesCount: data.speciesCount });
      } else {
        setUploadStatus(`Error: ${data.error}`);
      }
    } catch {
      setUploadStatus("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function handleManualLocation() {
    const parsedLat = parseFloat(manualLat);
    const parsedLng = parseFloat(manualLng);
    if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) return;
    setLocation(parsedLat, parsedLng);
  }

  async function handleZipLookup() {
    if (!/^\d{5}$/.test(zipCode)) {
      setZipError("Enter a valid 5-digit ZIP code");
      return;
    }

    setZipLoading(true);
    setZipError(null);

    try {
      const res = await fetch(`/api/geocode?zip=${zipCode}`);
      const data = await res.json();
      if (!res.ok) {
        setZipError(data.error ?? "ZIP code not found");
        return;
      }
      setLocation(data.lat, data.lng);
      setManualLat(String(data.lat.toFixed(4)));
      setManualLng(String(data.lng.toFixed(4)));
    } catch {
      setZipError("Lookup failed. Please try again.");
    } finally {
      setZipLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-lg font-semibold mb-3">Life List</h2>
        {stats && stats.speciesCount > 0 && (
          <p className="text-sm text-slate mb-3">
            {stats.speciesCount} species imported
          </p>
        )}
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            loading={uploading}
            variant="primary"
          >
            Upload CSV
          </Button>
          <a
            href="https://ebird.org/lifelist?time=life&r=world"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm text-forest hover:text-forest-light transition-colors"
          >
            Download from eBird &rarr;
          </a>
          {uploadStatus && (
            <p className={`text-sm ${uploadStatus.startsWith("Error") ? "text-red-600" : "text-forest"}`}>
              {uploadStatus}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold mb-3">Location</h2>
        <div className="space-y-4">
          {lat !== null && lng !== null && (
            <p className="text-sm text-slate">
              Current: {lat.toFixed(4)}, {lng.toFixed(4)}
            </p>
          )}

          <Button onClick={geo.requestLocation} loading={geo.loading} variant="secondary">
            Use My Location
          </Button>
          {geo.error && <p className="text-sm text-red-600">{geo.error}</p>}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-slate mb-1">ZIP Code</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleZipLookup()}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                placeholder="94107"
                maxLength={5}
              />
            </div>
            <Button onClick={handleZipLookup} loading={zipLoading} variant="secondary" size="sm">
              Set
            </Button>
          </div>
          {zipError && <p className="text-sm text-red-600">{zipError}</p>}

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs text-slate mb-1">Latitude</label>
              <input
                type="text"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                placeholder="37.7749"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-slate mb-1">Longitude</label>
              <input
                type="text"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                placeholder="-122.4194"
              />
            </div>
            <Button onClick={handleManualLocation} variant="secondary" size="sm">
              Set
            </Button>
          </div>

          <Slider
            value={radiusMiles}
            min={1}
            max={25}
            onChange={setRadius}
            label="Search Radius"
          />
        </div>
      </Card>
    </div>
  );
}
