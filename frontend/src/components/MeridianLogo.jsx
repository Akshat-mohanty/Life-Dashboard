import React from 'react';

/**
 * Meridian 3D Isometric Notched Cube Logo
 * Precision 3D isometric faceted geometry inspired by modern technical cubes.
 */
export default function MeridianLogo({ className = "w-9 h-9" }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} flex-shrink-0 transition-transform duration-300 hover:scale-105`}
    >
      {/* 1. Top Face (Pure light highlight) */}
      <polygon
        points="50,15 82,33.5 50,52 18,33.5"
        fill="#ECFDF5"
        stroke="#10B981"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 2. Left Face (Primary Emerald 500) */}
      <polygon
        points="18,33.5 50,52 50,87 18,68.5"
        fill="#10B981"
        stroke="#10B981"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 3. Upper Right Facet (Mid-tone Shade Emerald 600) */}
      <polygon
        points="50,52 82,33.5 82,49 64,59.4"
        fill="#059669"
        stroke="#059669"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 4. Inner Notch Recessed Wall (Deep Core Shadow Emerald 900) */}
      <polygon
        points="50,52 64,59.4 64,71 50,63.6"
        fill="#064E3B"
        stroke="#064E3B"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 5. Inner Horizontal Shelf (Reflective Step Emerald 300) */}
      <polygon
        points="50,63.6 64,71 72,66.4 58,59"
        fill="#6EE7B7"
        stroke="#6EE7B7"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 6. Lower Right Block Front & Side (Vibrant Emerald 400) */}
      <polygon
        points="64,59.4 82,49 82,66.5 50,87 50,63.6 64,71"
        fill="#34D399"
        stroke="#34D399"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
