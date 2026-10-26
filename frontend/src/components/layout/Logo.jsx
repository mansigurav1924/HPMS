import React from 'react';
import { Link } from 'react-router-dom';
import { Brand } from '../../config/brand';

/** HPMS wordmark. `tone="light"` is for dark backgrounds. */
export default function Logo({ to = '/', tone = 'dark', subtitle = true, className = '' }) {
  const light = tone === 'light';
  return (
    <Link to={to} className={`flex items-center gap-3 group ${className}`} aria-label="HPMS home">
      {/* Same SVG as the browser-tab favicon, so the logo is identical everywhere */}
      <img
        src={Brand.logo}
        alt=""
        className="w-10 h-10 rounded-xl shadow-glow group-hover:scale-105 transition-transform duration-200"
      />
      <div className="flex flex-col leading-none">
        <span className={`font-extrabold tracking-tight text-lg ${light ? 'text-white' : 'text-brand-navy'}`}>HPMS</span>
        {subtitle && (
          <span className={`font-semibold tracking-widest text-[10px] uppercase ${light ? 'text-primary-300' : 'text-primary-600'}`}>
            Stay · Simplified
          </span>
        )}
      </div>
    </Link>
  );
}
