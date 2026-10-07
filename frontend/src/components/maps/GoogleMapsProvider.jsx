import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import MapFallback from './MapFallback';

export default function GoogleMapsProvider({ children, properties, lat, lng }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    return <MapFallback error="Google Maps API Key Missing" properties={properties} lat={lat} lng={lng} />;
  }

  return (
    <APIProvider apiKey={apiKey} onLoad={() => console.log('Google Maps API loaded')}>
      {children}
    </APIProvider>
  );
}
