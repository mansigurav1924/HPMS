import React from 'react';

export default function InfoCard({ property, onMapClick }) {
  if (!property) return null;

  const id = property.property_id || property.id;
  const name = property.name || "Unknown Property";
  const cover = property.cover_photo || "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&q=80&w=400";
  const rating = property.avg_rating || 0;
  const beds = property.available_beds_count || 0;
  const minRent = property.min_rent || 0;

  return (
    <div className="w-64 bg-white rounded-xl shadow-xl overflow-hidden flex flex-col pointer-events-auto">
      <div className="h-32 w-full relative">
        <img src={cover} alt="Property cover" className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-brand-navy flex items-center gap-1 shadow-sm">
          ⭐ {rating > 0 ? rating.toFixed(1) : 'New'}
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-bold text-brand-navy text-base truncate">{name}</h3>
        <div className="flex justify-between items-center text-sm text-gray-500">
          <span>{beds} beds</span>
          <span className="font-extrabold text-brand-orange">${minRent}/mo</span>
        </div>
        <div className="flex justify-between gap-2 mt-2">
          {onMapClick && (
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${property.lat},${property.lng}`}
              target="_blank" rel="noopener noreferrer"
              className="flex-1 text-center py-1.5 bg-gray-100 hover:bg-gray-200 text-brand-navy rounded-lg text-xs font-bold transition-colors"
            >
              Directions
            </a>
          )}
          <a 
            href={`/properties/${id}`}
            className="flex-1 text-center py-1.5 bg-brand-navy hover:bg-brand-navy/90 text-white rounded-lg text-xs font-bold transition-colors"
          >
            View Details
          </a>
        </div>
      </div>
    </div>
  );
}
