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
        className={`px-3 py-1.5 rounded-full font-bold text-sm shadow-float transition-all ${
          isHovered || isSelected 
            ? 'bg-brand-navy text-white scale-110' 
            : 'bg-white text-brand-navy border border-gray-200 hover:border-brand-navy'
        }`}
      >
        ${property.min_rent || property.rent || 0} USD
      </div>
    </AdvancedMarker>
  );
}
