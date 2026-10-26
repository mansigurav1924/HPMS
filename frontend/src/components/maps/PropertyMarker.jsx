import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';

export default function PropertyMarker({ property, isHovered, isSelected, onClick }) {
  if (!property.lat || !property.lng) return null;

  return (
    <AdvancedMarker
      position={{ lat: property.lat, lng: property.lng }}
      onClick={() => onClick(property.id || property.property_id)}
      zIndex={isHovered || isSelected ? 100 : 1}
    >
      <div 
        className={`flex items-center justify-center w-10 h-10 rounded-full shadow-float transition-all ${
          isHovered || isSelected 
            ? 'bg-brand-navy text-white scale-110' 
            : 'bg-brand-orange text-white border-2 border-white hover:scale-110'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <polyline points="9 22 9 12 15 12 15 22"></polyline>
        </svg>
      </div>
    </AdvancedMarker>
  );
}
