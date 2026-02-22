"use client";

import { useState, useCallback } from "react";

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocation is not supported by your browser" }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (err) => {
        let message = "Unable to get your location";
        if (err.code === err.PERMISSION_DENIED) message = "Location permission denied";
        if (err.code === err.POSITION_UNAVAILABLE) message = "Location unavailable";
        if (err.code === err.TIMEOUT) message = "Location request timed out";
        setState((s) => ({ ...s, error: message, loading: false }));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }, []);

  return { ...state, requestLocation };
}
