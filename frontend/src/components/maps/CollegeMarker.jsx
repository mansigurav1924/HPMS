import React from 'react';
import { AdvancedMarker } from '@vis.gl/react-google-maps';
import { GraduationCap } from 'lucide-react';

export default function CollegeMarker({ college, onClick }) {
  if (!college.latitude || !college.longitude) return null;

  return (
    <AdvancedMarker
      position={{ lat: college.latitude, lng: college.longitude }}
      onClick={() => onClick && onClick(college)}
      zIndex={50}
    >
      <div className="w-8 h-8 bg-brand-orange text-white rounded-full flex items-center justify-center shadow-float border-2 border-white hover:scale-110 transition-transform">
        <GraduationCap size={16} />
      </div>
    </AdvancedMarker>
  );
}
