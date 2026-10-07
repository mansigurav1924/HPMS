import React, { useState, useEffect, useRef } from 'react';
import { Map, useMap } from '@vis.gl/react-google-maps';

export default function MapView({ 
  center = { lat: 28.6139, lng: 77.2090 }, 
  zoom = 12, 
  children,
  onBoundsChanged,
  className = "w-full h-full",
  options = {},
  autoLocate = false
}) {
  const map = useMap();

  // Auto-locate user if requested
  useEffect(() => {
    if (autoLocate && map && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.panTo({ lat: position.coords.latitude, lng: position.coords.longitude });
          map.setZoom(13); // Zoom in a bit when location is found
        },
        (error) => {
          console.warn("Geolocation blocked or failed.", error);
        }
      );
    }
  }, [map, autoLocate]);
  
  // Custom debounced bounds change handler
  const handleBoundsChanged = (e) => {
    if (!onBoundsChanged || !map) return;
    
    const bounds = map.getBounds();
    if (bounds) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      onBoundsChanged({
        north: ne.lat(),
        south: sw.lat(),
        east: ne.lng(),
        west: sw.lng(),
      });
    }
  };

  return (
    <div className={className}>
      <Map
        defaultCenter={center}
        defaultZoom={zoom}
        mapId={import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID"}
        gestureHandling="greedy"
        disableDefaultUI={true}
        zoomControl={true}
        onBoundsChanged={handleBoundsChanged}
        {...options}
      >
        {children}
      </Map>
    </div>
  );
}
