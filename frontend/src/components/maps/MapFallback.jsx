import React from 'react';

export default function MapFallback({ lat, lng, properties = [], error = "Map could not be loaded." }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4 rounded-xl text-center">
      <p className="text-gray-500 font-bold mb-4">{error}</p>
      
      {lat && lng && (
        <a 
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="px-4 py-2 bg-brand-navy text-white rounded-lg hover:bg-brand-navy/90 transition-colors mb-4"
        >
          Open in Google Maps
        </a>
      )}
      
      {properties.length > 0 && (
        <div className="w-full max-w-sm text-left mt-4 max-h-48 overflow-y-auto bg-white p-3 rounded-lg shadow-inner">
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Properties in this area:</p>
          {properties.slice(0, 10).map((p) => (
            <div key={p.property_id || p.id} className="text-sm py-1 border-b border-gray-100 last:border-0 truncate">
              {p.name}
            </div>
          ))}
          {properties.length > 10 && (
            <div className="text-xs text-gray-400 mt-2 italic">+ {properties.length - 10} more</div>
          )}
        </div>
      )}
    </div>
  );
}
