import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

export const hasGoogleMaps = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function GoogleMapsProvider({ children }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return <>{children}</>;
  }

  return (
    <APIProvider apiKey={apiKey} onLoad={() => console.log('Google Maps API loaded')}>
      {children}
    </APIProvider>
  );
}
