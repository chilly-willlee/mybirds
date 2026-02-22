"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useSession } from "next-auth/react";

interface LocationContextValue {
  lat: number | null;
  lng: number | null;
  radiusMiles: number;
  isLoaded: boolean;
  setLocation: (lat: number, lng: number) => void;
  setRadius: (miles: number) => void;
}

const LocationContext = createContext<LocationContextValue>({
  lat: null,
  lng: null,
  radiusMiles: 10,
  isLoaded: false,
  setLocation: () => {},
  setRadius: () => {},
});

export function useLocation() {
  return useContext(LocationContext);
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radiusMiles, setRadiusMiles] = useState(10);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/settings")
        .then((r) => r.json())
        .then((data) => {
          if (data.lat !== null) setLat(data.lat);
          if (data.lng !== null) setLng(data.lng);
          if (data.radiusMiles) setRadiusMiles(data.radiusMiles);
          setIsLoaded(true);
        })
        .catch(() => setIsLoaded(true));
    } else {
      const saved = localStorage.getItem("newbirds-location");
      if (saved) {
        const parsed = JSON.parse(saved);
        setLat(parsed.lat ?? null);
        setLng(parsed.lng ?? null);
        setRadiusMiles(parsed.radiusMiles ?? 10);
      }
      setIsLoaded(true);
    }
  }, [session]);

  const setLocation = useCallback(
    (newLat: number, newLng: number) => {
      setLat(newLat);
      setLng(newLng);
      if (session?.user) {
        fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: newLat, lng: newLng }),
        });
      } else {
        const saved = JSON.parse(localStorage.getItem("newbirds-location") ?? "{}");
        localStorage.setItem("newbirds-location", JSON.stringify({ ...saved, lat: newLat, lng: newLng }));
      }
    },
    [session],
  );

  const setRadius = useCallback(
    (miles: number) => {
      setRadiusMiles(miles);
      if (session?.user) {
        fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ radiusMiles: miles }),
        });
      } else {
        const saved = JSON.parse(localStorage.getItem("newbirds-location") ?? "{}");
        localStorage.setItem("newbirds-location", JSON.stringify({ ...saved, radiusMiles: miles }));
      }
    },
    [session],
  );

  return (
    <LocationContext.Provider value={{ lat, lng, radiusMiles, isLoaded, setLocation, setRadius }}>
      {children}
    </LocationContext.Provider>
  );
}
