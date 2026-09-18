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
        fill="#F0FBFD"
        stroke="#9BDEE8"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 2. Left Face (Base Accent #9BDEE8) */}
      <polygon
        points="18,33.5 50,52 50,87 18,68.5"
        fill="#9BDEE8"
        stroke="#9BDEE8"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 3. Upper Right Facet (Mid-tone Shade #3FAAB9) */}
      <polygon
        points="50,52 82,33.5 82,49 64,59.4"
        fill="#3FAAB9"
        stroke="#3FAAB9"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 4. Inner Notch Recessed Wall (Deep Core Shadow #154F59) */}
      <polygon
        points="50,52 64,59.4 64,71 50,63.6"
        fill="#154F59"
        stroke="#154F59"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 5. Inner Horizontal Shelf (Reflective Step #BCECF4) */}
      <polygon
        points="50,63.6 64,71 72,66.4 58,59"
        fill="#BCECF4"
        stroke="#BCECF4"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* 6. Lower Right Block Front & Side (Vibrant Cyan #68C5D4) */}
      <polygon
        points="64,59.4 82,49 82,66.5 50,87 50,63.6 64,71"
        fill="#68C5D4"
        stroke="#68C5D4"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
